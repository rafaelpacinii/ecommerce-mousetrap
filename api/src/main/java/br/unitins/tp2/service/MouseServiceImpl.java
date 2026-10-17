package br.unitins.tp2.service;

import java.util.List;
import java.util.stream.Collectors;
import br.unitins.tp2.dto.MouseDTO;
import br.unitins.tp2.dto.MouseResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.model.Marca;
import br.unitins.tp2.model.Mouse;
import br.unitins.tp2.model.ImagemMouse;
import br.unitins.tp2.model.Pegada;
import br.unitins.tp2.model.TipoSwitch;
import br.unitins.tp2.model.TipoConexao;
import br.unitins.tp2.repository.MarcaRepository;
import br.unitins.tp2.repository.MouseRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.security.RolesAllowed;
import jakarta.persistence.OptimisticLockException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
@RolesAllowed("admin")
public class MouseServiceImpl implements MouseService {
    @Inject MouseRepository repository;
    @Inject MarcaRepository marcaRepository;
    @Inject jakarta.persistence.EntityManager em;

    @Override public br.unitins.tp2.dto.PageResponse<MouseResponseDTO> pesquisar(String busca,String ordenar,int page,int size){
        if(page<0||size<1||size>100)throw new jakarta.ws.rs.BadRequestException("Paginação inválida.");
        String termo=busca==null?"":busca.strip();if(termo.length()>150)throw new jakarta.ws.rs.BadRequestException("Busca muito longa.");
        String ordem=switch(ordenar==null?"nome":ordenar){case "nome"->"nome";case "nome-desc"->"nome desc";case "preco"->"preco";case "preco-desc"->"preco desc";case "quantidadeEstoque"->"quantidadeEstoque";case "quantidadeEstoque-desc"->"quantidadeEstoque desc";case "ativo"->"ativo";case "ativo-desc"->"ativo desc";default->throw new jakarta.ws.rs.BadRequestException("Ordenação inválida.");};
        var q=repository.find("lower(nome) like ?1 order by "+ordem+",id asc","%"+termo.toLowerCase(java.util.Locale.ROOT)+"%");
        long total=q.count();return br.unitins.tp2.dto.PageResponse.of(q.page(page,size).list(),page,size,total,MouseResponseDTO::valueOf);
    }
    @Override
    public List<Mouse> findAll(int page, int pageSize) {
        return repository.findAll().page(page, pageSize).list();
    }

    @Override
    public List<Mouse> findByNome(String nome, int page, int pageSize) {
        return repository.findByNome(nome).page(page, pageSize).list();
    }

    @Override
    public long count() {
        return repository.findAll().count();
    }

    @Override
    public long count(String nome) {
        return repository.findByNome(nome).count();
    }

    @Override
    public MouseResponseDTO findById(Long id) {
        return MouseResponseDTO.valueOf(buscar(id));
    }

    @Override
    @Transactional
    public MouseResponseDTO create(MouseDTO dto) {
        Mouse mouse = new Mouse();
        preencher(mouse, dto);
        repository.persistAndFlush(mouse);
        return MouseResponseDTO.valueOf(mouse);
    }

    @Override
    @Transactional
    public MouseResponseDTO update(Long id, MouseDTO dto) {
        Mouse mouse = buscar(id);
        if (dto.versao() == null || !dto.versao().equals(mouse.getVersao())) {
            throw new OptimisticLockException("O mouse foi alterado. Recarregue o cadastro antes de salvar.");
        }
        preencher(mouse, dto);
        repository.flush();
        return MouseResponseDTO.valueOf(mouse);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Mouse mouse=repository.findById(id,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if(mouse==null)throw new NotFoundException("Mouse não encontrado.");
        if(em.createQuery("select count(i) from ItemPedido i where i.mouse.id = :id",Long.class).setParameter("id",id).getSingleResult()>0)
            throw new ValidationException("mouse","Este mouse possui pedidos. Desative o produto para preservar o histórico.");
        repository.delete(mouse);
        repository.flush();
    }

    private Mouse buscar(Long id) {
        Mouse mouse = repository.findById(id);
        if (mouse == null) throw new NotFoundException("Mouse não encontrado.");
        return mouse;
    }

    private void preencher(Mouse mouse, MouseDTO dto) {
        Mouse existente = repository.findBySku(dto.sku());
        if (existente != null && !existente.getId().equals(mouse.getId())) {
            throw new ValidationException("sku", "Já existe um mouse com esse SKU.");
        }
        Marca marca = marcaRepository.findById(dto.idMarca());
        if (marca == null) throw new ValidationException("idMarca", "A marca selecionada não existe.");
        if (dto.especificacoes() != null) {
            var especificacoes = dto.especificacoes();
            if (especificacoes.pollingRate() != null && !java.util.Set.of(125, 250, 500, 1000, 2000, 4000, 8000).contains(especificacoes.pollingRate())) {
                throw new ValidationException("especificacoes.pollingRate", "Selecione uma taxa de atualização suportada.");
            }
            mouse.setSensor(especificacoes.sensor() == null || especificacoes.sensor().isBlank() ? null : especificacoes.sensor());
            mouse.setPollingRate(especificacoes.pollingRate());
            mouse.setTipoSwitch(TipoSwitch.valueOf(especificacoes.tipoSwitch()));
            mouse.setModeloSwitch(especificacoes.modeloSwitch() == null || especificacoes.modeloSwitch().isBlank() ? null : especificacoes.modeloSwitch());
            mouse.getPegadas().clear();
            if (especificacoes.pegadas() != null) mouse.getPegadas().addAll(especificacoes.pegadas().stream().map(Pegada::valueOf).toList());
        }
        if (dto.imagens() != null) {
            if (dto.imagens().stream().map(i -> i.ordem()).distinct().count() != dto.imagens().size()) {
                throw new ValidationException("imagens", "A ordem das imagens não pode se repetir.");
            }
            for (var imagem : dto.imagens()) {
                try {
                    var uri = java.net.URI.create(imagem.url());
                    if (uri.isAbsolute() && uri.getHost() == null) throw new IllegalArgumentException();
                } catch (IllegalArgumentException ex) {
                    throw new ValidationException("imagens", "Informe um endereço de imagem válido.");
                }
            }
            mouse.getImagens().clear();
            // Release previous unique order values before inserting the replacement gallery.
            if (mouse.getId() != null) repository.flush();
            for (var imagemDto : dto.imagens()) {
                ImagemMouse imagem = new ImagemMouse();
                imagem.setMouse(mouse);
                imagem.setUrl(imagemDto.url());
                imagem.setTextoAlternativo(imagemDto.textoAlternativo());
                imagem.setOrdem(imagemDto.ordem());
                mouse.getImagens().add(imagem);
            }
        }
        mouse.setMarca(marca);
        mouse.setSku(dto.sku());
        mouse.setNome(dto.nome());
        mouse.setDescricao(dto.descricao());
        mouse.setCor(dto.cor());
        mouse.setPreco(dto.preco());
        mouse.setQuantidadeEstoque(dto.quantidadeEstoque());
        mouse.setDpiMaximo(dto.dpiMaximo());
        mouse.setQuantidadeBotoes(dto.quantidadeBotoes());
        mouse.setPesoGramas(dto.pesoGramas());
        mouse.setAtivo(dto.ativo());
        mouse.getTiposConexao().clear();
        mouse.getTiposConexao().addAll(dto.tiposConexao().stream()
                .map(TipoConexao::valueOf).collect(Collectors.toSet()));
    }
}
