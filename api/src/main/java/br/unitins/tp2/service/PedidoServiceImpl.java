package br.unitins.tp2.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import br.unitins.tp2.dto.*;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.exception.ConflitoPedidoException;
import br.unitins.tp2.model.*;
import br.unitins.tp2.repository.*;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.security.identity.SecurityIdentity;

@ApplicationScoped
@RolesAllowed({"customer", "admin"})
public class PedidoServiceImpl implements PedidoService {
    @Inject PedidoRepository pedidos;
    @Inject PagamentoRepository pagamentos;
    @Inject MouseRepository mouses;
    @Inject MarcaRepository marcas;
    @Inject ClienteRepository clientes;
    @Inject EnderecoRepository enderecos;
    @Inject CepService cep;
    @Inject EntityManager em;
    @Inject JsonWebToken token;
    @Inject SecurityIdentity identity;
    @ConfigProperty(name = "pagamentos.simulacao.habilitada", defaultValue = "false") boolean simulacaoHabilitada;
    @ConfigProperty(name = "pedidos.prazo-pagamento-minutos", defaultValue = "30") int prazoMinutos;

    @Override public CheckoutConfiguracaoResponseDTO configuracao() {
        return new CheckoutConfiguracaoResponseDTO(simulacaoHabilitada, Math.max(1, prazoMinutos));
    }

    @Override @Transactional
    public RevisaoPedidoResponseDTO revisar(RevisaoPedidoDTO dto) {
        exigirSimulacao();
        Endereco endereco = enderecoDoCliente(dto.idEndereco());
        var frete = cep.calcularFrete(endereco.getCep());
        List<ItemPedido> itens = montarItens(dto.itens(), false);
        BigDecimal subtotal = itens.stream().map(ItemPedido::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new RevisaoPedidoResponseDTO(EnderecoEntregaResponseDTO.valueOf(EnderecoEntrega.valueOf(endereco)),
            itens.stream().map(ItemPedidoResponseDTO::valueOf).toList(), subtotal, frete, subtotal.add(frete.valorFrete()));
    }

    @Override @Transactional
    public PedidoResponseDTO criar(PedidoDTO dto) {
        exigirSimulacao();
        String subject = subject();
        String hash = hash(dto);
        bloquearChave(dto.chaveCheckout());
        Pedido existente = pedidos.findByChave(dto.chaveCheckout());
        if (existente != null) {
            if (!subject.equals(existente.getCliente().getIdentidadeSubject()) || !hash.equals(existente.getRequisicaoHash()))
                throw new ConflitoPedidoException("Esta tentativa já foi utilizada para outra compra. Revise o pedido.");
            return PedidoResponseDTO.valueOf(existente);
        }
        Endereco endereco = enderecoDoCliente(dto.idEndereco());
        var frete = cep.calcularFrete(endereco.getCep());
        if (frete.valorFrete().compareTo(dto.freteEsperado()) != 0)
            throw new ConflitoPedidoException("O frete mudou. Atualize a revisão e confirme os novos valores.");
        List<ItemPedido> itens = montarItens(dto.itens(), true);
        Pedido pedido = new Pedido();
        pedido.setCliente(endereco.getCliente()); pedido.setChaveCheckout(dto.chaveCheckout());
        pedido.setRequisicaoHash(hash); pedido.setStatus(StatusPedido.AGUARDANDO_PAGAMENTO);
        pedido.setCriadoEm(Instant.now()); pedido.setExpiraEm(pedido.getCriadoEm().plus(Math.max(1, prazoMinutos), ChronoUnit.MINUTES));
        pedido.setEndereco(EnderecoEntrega.valueOf(endereco));
        pedido.setFrete(frete.valorFrete()); pedido.setPrazoDiasUteis(frete.prazoDiasUteis());
        for (ItemPedido item : itens) { item.setPedido(pedido); pedido.getItens().add(item); }
        registrarEvento(pedido,"Pedido recebido.",subject);
        pedidos.persistAndFlush(pedido);
        return PedidoResponseDTO.valueOf(pedido);
    }

    @Override @Transactional
    public PedidoResponseDTO findById(Long id) {
        Pedido p = proprio(id); expirarSeVencido(p);
        return PedidoResponseDTO.valueOf(p);
    }

    @Override @Transactional
    public PedidoResponseDTO pagar(Long id, PagamentoDTO dto) {
        exigirSimulacao();
        if (dto.resultadoSimulado() != 3 && !identity.hasRole("admin"))
            throw new ForbiddenException("A confirmação do pagamento requer autorização administrativa.");
        bloquearChave(dto.chaveIdempotencia());
        Pedido p = proprio(id);
        Pagamento anterior = pagamentos.findByChave(dto.chaveIdempotencia());
        if (anterior != null) {
            if (!anterior.getPedido().getId().equals(id) || !anterior.getForma().getId().equals(dto.forma())
                    || !anterior.getResultadoSimulado().getId().equals(dto.resultadoSimulado()))
                throw new ConflitoPedidoException("Esta tentativa de pagamento já foi utilizada com outros dados.");
            expirarSeVencido(p);
            return PedidoResponseDTO.valueOf(p);
        }
        if (expirarSeVencido(p) || p.getStatus() == StatusPedido.EXPIRADO)
            return PedidoResponseDTO.valueOf(p);
        exigirAguardando(p);
        if (p.getPagamentos().stream().anyMatch(v -> v.getStatus() == StatusPagamento.PENDENTE || v.getStatus() == StatusPagamento.APROVADO))
            throw new ConflitoPedidoException("Já existe um pagamento em processamento para este pedido.");
        Pagamento pagamento = new Pagamento();
        pagamento.setPedido(p); pagamento.setChaveIdempotencia(dto.chaveIdempotencia());
        pagamento.setForma(FormaPagamento.valueOf(dto.forma()));
        pagamento.setResultadoSimulado(ResultadoSimulacao.valueOf(dto.resultadoSimulado()));
        pagamento.setValor(p.getTotal()); pagamento.setStatus(StatusPagamento.PENDENTE);
        aplicarResultado(p, pagamento, pagamento.getResultadoSimulado());
        pagamentos.persistAndFlush(pagamento); p.getPagamentos().add(pagamento);
        return PedidoResponseDTO.valueOf(p);
    }

    @Override @Transactional @RolesAllowed("admin")
    public PedidoResponseDTO simular(Long id, Long pagamentoId, SimulacaoPagamentoDTO dto) {
        exigirSimulacao();
        Pedido p = proprio(id);
        if (expirarSeVencido(p) || p.getStatus() == StatusPedido.EXPIRADO) return PedidoResponseDTO.valueOf(p);
        Pagamento pagamento = p.getPagamentos().stream().filter(v -> v.getId().equals(pagamentoId)).findFirst().orElseThrow(NotFoundException::new);
        em.lock(pagamento, LockModeType.PESSIMISTIC_WRITE);
        ResultadoSimulacao resultado = ResultadoSimulacao.valueOf(dto.resultado());
        StatusPagamento esperado = resultado == ResultadoSimulacao.APROVAR ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO;
        if (pagamento.getStatus() == esperado) return PedidoResponseDTO.valueOf(p);
        exigirAguardando(p);
        if (pagamento.getStatus() != StatusPagamento.PENDENTE) throw new ConflitoPedidoException("Este pagamento já foi concluído.");
        aplicarResultado(p, pagamento, resultado);
        pedidos.flush(); return PedidoResponseDTO.valueOf(p);
    }

    @Override @Transactional
    public PedidoResponseDTO cancelar(Long id) {
        Pedido p = proprio(id);
        if (expirarSeVencido(p) || p.getStatus() == StatusPedido.EXPIRADO || p.getStatus() == StatusPedido.CANCELADO)
            return PedidoResponseDTO.valueOf(p);
        exigirAguardando(p); encerrar(p, StatusPedido.CANCELADO);
        return PedidoResponseDTO.valueOf(p);
    }

    @Override @PermitAll
    public void expirarVencidos() {
        // Each candidate gets its own transaction; one contested order never rolls back the entire batch.
        List<Long> ids = QuarkusTransaction.requiringNew().call(() -> pedidos.vencidos(Instant.now()));
        for (Long id : ids) QuarkusTransaction.requiringNew().run(() -> {
            Pedido p = pedidos.findById(id, LockModeType.PESSIMISTIC_WRITE);
            if (p != null) expirarSeVencido(p);
        });
    }

    @Override public PageResponse<PedidoResponseDTO> meusPedidos(int page,int size) {
        validarPagina(page,size);
        var q=pedidos.find("cliente.identidadeSubject = ?1 order by criadoEm desc,id desc",subject());
        long total=q.count();return PageResponse.of(q.page(page,size).list(),page,size,total,PedidoResponseDTO::valueOf);
    }
    @Override @RolesAllowed("admin")
    public PageResponse<PedidoResumoResponseDTO> listarAdmin(String busca,Integer status,String ordenar,int page,int size) {
        validarPagina(page,size);
        Map<String,Object> params=new HashMap<>();String where="1=1";
        if(status!=null){if(status<1||status>6)throw new BadRequestException("Situação inválida.");where+=" and status = :status";params.put("status",StatusPedido.valueOf(status));}
        String termo=busca==null?"":busca.strip();
        if(termo.length()>150)throw new BadRequestException("Busca muito longa.");
        if(!termo.isBlank()){where+=" and (lower(cliente.nome) like :busca or lower(cliente.email) like :busca or cast(id as String) like :busca)";params.put("busca","%"+termo.replaceFirst("^#","").toLowerCase(Locale.ROOT)+"%");}
        String ordem=switch(ordenar==null?"recentes":ordenar){case "recentes"->"criadoEm desc,id desc";case "antigos"->"criadoEm asc,id asc";case "cliente"->"cliente.nome asc,id desc";case "cliente-desc"->"cliente.nome desc,id desc";case "status"->"status asc,id desc";case "status-desc"->"status desc,id desc";default->throw new BadRequestException("Ordenação inválida.");};
        var q=pedidos.find(where+" order by "+ordem,params);long total=q.count();
        return PageResponse.of(q.page(page,size).list(),page,size,total,PedidoResumoResponseDTO::valueOf);
    }
    @Override @Transactional @RolesAllowed("admin") public PedidoAdminResponseDTO detalheAdmin(Long id){
        Pedido p=administrativo(id);expirarSeVencido(p);return PedidoAdminResponseDTO.valueOf(p);
    }
    @Override @RolesAllowed("admin") public IndicadoresPedidoResponseDTO indicadores(){
        var mes=java.time.LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")).withDayOfMonth(1);
        var inicio=mes.atStartOfDay(java.time.ZoneId.of("America/Sao_Paulo")).toInstant();
        var fim=mes.plusMonths(1).atStartOfDay(java.time.ZoneId.of("America/Sao_Paulo")).toInstant();
        BigDecimal receita=em.createQuery("select coalesce(sum(valor),0) from Pagamento where status = :status and processadoEm >= :inicio and processadoEm < :fim",BigDecimal.class)
            .setParameter("status",StatusPagamento.APROVADO).setParameter("inicio",inicio).setParameter("fim",fim).getSingleResult();
        return new IndicadoresPedidoResponseDTO(receita,pedidos.count("status = ?1 and expiraEm > ?2",StatusPedido.AGUARDANDO_PAGAMENTO,Instant.now()),
            mouses.count("ativo = true and marca.ativo = true"),clientes.count(),inicio,fim);
    }
    @Override @Transactional @RolesAllowed("admin")
    public PedidoAdminResponseDTO decidirPagamento(Long id,Long pagamentoId,DecisaoPagamentoDTO dto){
        exigirSimulacao();Pedido p=administrativo(id);
        if(expirarSeVencido(p)||p.getStatus()==StatusPedido.EXPIRADO)return PedidoAdminResponseDTO.valueOf(p);
        Pagamento pagamento=p.getPagamentos().stream().filter(v->v.getId().equals(pagamentoId)).findFirst().orElseThrow(NotFoundException::new);
        em.lock(pagamento,LockModeType.PESSIMISTIC_WRITE);
        var resultado=ResultadoSimulacao.valueOf(dto.resultado());
        var esperado=resultado==ResultadoSimulacao.APROVAR?StatusPagamento.APROVADO:StatusPagamento.RECUSADO;
        if(pagamento.getStatus()==esperado)return PedidoAdminResponseDTO.valueOf(p);
        exigirVersao(p,dto.versao());exigirAguardando(p);
        if(pagamento.getStatus()!=StatusPagamento.PENDENTE)throw new ConflitoPedidoException("Este pagamento já foi concluído.");
        aplicarResultado(p,pagamento,resultado);pedidos.flush();return PedidoAdminResponseDTO.valueOf(p);
    }
    @Override @Transactional @RolesAllowed("admin") public PedidoAdminResponseDTO enviar(Long id,EnvioPedidoDTO dto){
        Pedido p=administrativo(id);
        String transportadora=dto.transportadora().strip(),codigo=dto.codigoRastreio().strip();
        if((p.getStatus()==StatusPedido.ENVIADO||p.getStatus()==StatusPedido.ENTREGUE)&&transportadora.equals(p.getTransportadora())&&codigo.equals(p.getCodigoRastreio()))return PedidoAdminResponseDTO.valueOf(p);
        exigirVersao(p,dto.versao());
        if(p.getStatus()!=StatusPedido.PAGO)throw new ConflitoPedidoException("Somente pedidos pagos podem ser enviados.");
        p.setTransportadora(transportadora);p.setCodigoRastreio(codigo);p.setEnviadoEm(Instant.now());p.setStatus(StatusPedido.ENVIADO);
        registrarEvento(p,"Pedido enviado pela transportadora.",subject());pedidos.flush();return PedidoAdminResponseDTO.valueOf(p);
    }
    @Override @Transactional @RolesAllowed("admin") public PedidoAdminResponseDTO entregar(Long id,OperacaoPedidoDTO dto){
        Pedido p=administrativo(id);if(p.getStatus()==StatusPedido.ENTREGUE)return PedidoAdminResponseDTO.valueOf(p);
        exigirVersao(p,dto.versao());if(p.getStatus()!=StatusPedido.ENVIADO)throw new ConflitoPedidoException("Somente pedidos enviados podem ser entregues.");
        p.setEntregueEm(Instant.now());p.setStatus(StatusPedido.ENTREGUE);registrarEvento(p,"Entrega confirmada.",subject());pedidos.flush();return PedidoAdminResponseDTO.valueOf(p);
    }
    @Override @Transactional @RolesAllowed("admin") public PedidoAdminResponseDTO cancelarAdmin(Long id,OperacaoPedidoDTO dto){
        Pedido p=administrativo(id);if(expirarSeVencido(p)||p.getStatus()==StatusPedido.EXPIRADO||p.getStatus()==StatusPedido.CANCELADO)return PedidoAdminResponseDTO.valueOf(p);
        exigirVersao(p,dto.versao());exigirAguardando(p);encerrar(p,StatusPedido.CANCELADO);return PedidoAdminResponseDTO.valueOf(p);
    }
    private Pedido administrativo(Long id){Pedido p=pedidos.findById(id,LockModeType.PESSIMISTIC_WRITE);if(p==null)throw new NotFoundException("Pedido não encontrado.");return p;}
    private void exigirVersao(Pedido p,Long versao){if(!Objects.equals(p.getVersao(),versao))throw new ConflitoPedidoException("O pedido foi atualizado. Recarregue os dados antes de continuar.");}
    private void validarPagina(int page,int size){if(page<0||size<1||size>100)throw new BadRequestException("Paginação inválida.");}
    private void registrarEvento(Pedido p,String descricao,String responsavel){
        EventoPedido e=new EventoPedido();e.setPedido(p);e.setStatus(p.getStatus());e.setOcorridoEm(Instant.now());e.setDescricao(descricao);e.setResponsavelSubject(responsavel);
        p.getEventos().add(e);if(p.getId()!=null){p.setDataAlteracao(java.time.LocalDateTime.now());em.persist(e);}
    }
    private Pedido proprio(Long id) {
        String subject = subject();
        // Ownership is part of the locked query, so another account never obtains this order's data.
        Pedido p = pedidos.find("id = ?1 and cliente.identidadeSubject = ?2", id, subject)
            .withLock(LockModeType.PESSIMISTIC_WRITE).firstResult();
        if (p == null) throw new NotFoundException("Pedido não encontrado.");
        return p;
    }

    private Endereco enderecoDoCliente(Long id) {
        String subject = subject();
        // Lock the customer before its address to serialize order creation with historical-safe deletion.
        var cliente=clientes.find("identidadeSubject",subject).withLock(LockModeType.PESSIMISTIC_READ).firstResult();
        if(cliente==null)throw new NotFoundException("Cadastre seu endereço de entrega.");
        Endereco e = enderecos.find("id = ?1 and cliente.identidadeSubject = ?2", id, subject)
            .withLock(LockModeType.PESSIMISTIC_READ).firstResult();
        if (e == null) throw new NotFoundException("Endereço de entrega não encontrado. Cadastre ou selecione um endereço da sua conta.");
        return e;
    }

    private List<ItemPedido> montarItens(List<ItemCheckoutDTO> entradas, boolean comprometer) {
        List<ItemCheckoutDTO> ordenados = entradas.stream().sorted(Comparator.comparing(ItemCheckoutDTO::idMouse)).toList();
        if (ordenados.stream().map(ItemCheckoutDTO::idMouse).distinct().count() != ordenados.size())
            throw new ValidationException("itens", "Um produto não pode se repetir no pedido.");
        Map<Long, Mouse> produtos = new LinkedHashMap<>();
        for (var item : ordenados) {
            Mouse mouse = comprometer ? mouses.findById(item.idMouse(), LockModeType.PESSIMISTIC_WRITE) : mouses.findById(item.idMouse());
            if (mouse == null) throw new ConflitoPedidoException("Um produto não está mais disponível. Revise seu carrinho.");
            produtos.put(item.idMouse(), mouse);
        }
        if (comprometer) produtos.values().stream().map(v -> v.getMarca().getId()).distinct().sorted()
            .forEach(id -> { Marca marca = marcas.findById(id, LockModeType.PESSIMISTIC_READ); em.refresh(marca); });
        List<ItemPedido> resultado = new ArrayList<>();
        for (var entrada : ordenados) {
            Mouse m = produtos.get(entrada.idMouse());
            if (!Boolean.TRUE.equals(m.getAtivo()) || !Boolean.TRUE.equals(m.getMarca().getAtivo()))
                throw new ConflitoPedidoException("Um produto não está mais disponível. Revise seu carrinho.");
            if (m.getQuantidadeEstoque() < entrada.quantidade()) throw new ConflitoPedidoException("Estoque insuficiente para " + m.getNome() + ". Revise seu carrinho.");
            if (comprometer && (entrada.precoEsperado() == null || entrada.precoEsperado().compareTo(m.getPreco()) != 0))
                throw new ConflitoPedidoException("O preço de " + m.getNome() + " mudou. Atualize a revisão e confirme os valores.");
            ItemPedido item = new ItemPedido(); item.setMouse(m); item.setNome(m.getNome()); item.setSku(m.getSku());
            item.setCor(m.getCor()); item.setMarca(m.getMarca().getNome()); item.setQuantidade(entrada.quantidade()); item.setPrecoUnitario(m.getPreco());
            resultado.add(item);
        }
        // All lines have passed validation before any available quantity changes.
        if (comprometer) for (ItemPedido i : resultado) i.getMouse().setQuantidadeEstoque(i.getMouse().getQuantidadeEstoque() - i.getQuantidade());
        return resultado;
    }

    private boolean expirarSeVencido(Pedido p) {
        if (p.getStatus() != StatusPedido.AGUARDANDO_PAGAMENTO || Instant.now().isBefore(p.getExpiraEm())) return false;
        encerrar(p, StatusPedido.EXPIRADO); return true;
    }

    private void encerrar(Pedido p, StatusPedido status) {
        p.getPagamentos().stream().filter(v -> v.getStatus() == StatusPagamento.PENDENTE).forEach(v -> {
            em.lock(v, LockModeType.PESSIMISTIC_WRITE); v.setStatus(StatusPagamento.CANCELADO); v.setProcessadoEm(Instant.now());
        });
        p.getItens().stream().sorted(Comparator.comparing(v -> v.getMouse().getId())).forEach(i -> {
            Mouse m = mouses.findById(i.getMouse().getId(), LockModeType.PESSIMISTIC_WRITE);
            // Item traversal may have initialized a product before acquiring its lock.
            em.refresh(m); m.setQuantidadeEstoque(Math.addExact(m.getQuantidadeEstoque(), i.getQuantidade()));
        });
        p.setStatus(status);
        registrarEvento(p,status==StatusPedido.EXPIRADO?"Prazo de pagamento encerrado.":"Pedido cancelado.",status==StatusPedido.EXPIRADO?null:subject());
        pedidos.flush();
    }

    private void aplicarResultado(Pedido p, Pagamento pagamento, ResultadoSimulacao resultado) {
        if (resultado == ResultadoSimulacao.PENDENTE) return;
        pagamento.setStatus(resultado == ResultadoSimulacao.APROVAR ? StatusPagamento.APROVADO : StatusPagamento.RECUSADO);
        pagamento.setProcessadoEm(Instant.now());
        if (resultado == ResultadoSimulacao.APROVAR) p.setStatus(StatusPedido.PAGO);
        registrarEvento(p,resultado==ResultadoSimulacao.APROVAR?"Pagamento confirmado.":"Pagamento não aprovado.",subject());
    }
    private void exigirAguardando(Pedido p) {
        if (p.getStatus() != StatusPedido.AGUARDANDO_PAGAMENTO) throw new ConflitoPedidoException("Este pedido não aceita esta operação no estado atual.");
    }
    private void exigirSimulacao() {
        if (!simulacaoHabilitada) throw new ValidationException("checkout", "O checkout está indisponível no momento. Tente novamente mais tarde.");
    }
    private String subject() {
        if (token.getSubject() == null || token.getSubject().isBlank()) throw new ForbiddenException();
        return token.getSubject();
    }
    private void bloquearChave(UUID chave) {
        // Transaction-scoped database locks deduplicate requests across JVMs, not just inside one process.
        em.createNativeQuery("SELECT pg_advisory_xact_lock(:chave)")
            .setParameter("chave", chave.getMostSignificantBits() ^ chave.getLeastSignificantBits()).getSingleResult();
    }
    private String hash(PedidoDTO dto) {
        StringBuilder s = new StringBuilder().append(dto.idEndereco()).append('|').append(dto.freteEsperado().setScale(2));
        dto.itens().stream().sorted(Comparator.comparing(ItemCheckoutDTO::idMouse)).forEach(i -> s.append('|').append(i.idMouse())
            .append(':').append(i.quantidade()).append(':').append(i.precoEsperado() == null ? "null" : i.precoEsperado().setScale(2)));
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.toString().getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
