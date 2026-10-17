package br.unitins.tp2.resource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import br.unitins.tp2.model.*;
import br.unitins.tp2.repository.*;
import br.unitins.tp2.service.PedidoService;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.*;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.*;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

@QuarkusTest
@TestProfile(CatalogoTestProfile.class)
@QuarkusTestResource(value = ViaCepTestResource.class, restrictToAnnotatedClass = true)
@TestSecurity(user = "checkout", roles = {"customer", "admin"})
@OidcSecurity(claims = {@Claim(key = "sub", value = "checkout-a")})
class PedidoResourceTest {
    @Inject EntityManager em;
    @Inject MouseRepository mouses;
    @Inject MarcaRepository marcas;
    @Inject ClienteRepository clientes;
    @Inject EnderecoRepository enderecos;
    @Inject EstadoRepository estados;
    @Inject MunicipioRepository municipios;
    @Inject PedidoRepository pedidos;
    @Inject PagamentoRepository pagamentos;
    @Inject PedidoService service;
    long marcaId, mouseId, segundoMouseId, clienteId, outroClienteId, enderecoId, outroEnderecoId;

    @BeforeEach void preparar() {
        QuarkusTransaction.requiringNew().run(() -> {
            municipios.inserirSeAusente("São Paulo", "3550308", estados.findBySigla("SP").getId());
            Marca marca = new Marca(); marca.setNome("Checkout " + UUID.randomUUID()); marca.setAtivo(true); marcas.persistAndFlush(marca); marcaId = marca.getId();
            mouseId = mouse(marca, 5).getId(); segundoMouseId = mouse(marca, 5).getId();
            Cliente a = cliente("checkout-a"), b = cliente("checkout-b"); clienteId = a.getId(); outroClienteId = b.getId();
            enderecoId = endereco(a).getId(); outroEnderecoId = endereco(b).getId();
        });
    }
    Mouse mouse(Marca marca, int estoque) {
        Mouse m = new Mouse(); m.setSku(("CHECK-" + UUID.randomUUID()).toUpperCase(java.util.Locale.ROOT)); m.setNome("Mouse checkout"); m.setDescricao("Teste"); m.setCor("Preto");
        m.setPreco(new BigDecimal("100.00")); m.setQuantidadeEstoque(estoque); m.setDpiMaximo(16000); m.setQuantidadeBotoes(6);
        m.setPesoGramas(new BigDecimal("54")); m.setAtivo(true); m.setMarca(marca); m.getTiposConexao().add(TipoConexao.valueOf(1));
        mouses.persistAndFlush(m); return m;
    }
    Cliente cliente(String subject) {
        Cliente c = new Cliente(); c.setNome("Comprador"); c.setEmail(UUID.randomUUID() + "@example.test"); c.setIdentidadeSubject(subject);
        c.setCep("01001000"); c.setLogradouro("Praça da Sé"); c.setBairro("Sé"); c.setNumero("10"); c.setMunicipio(municipios.findByCodigoIbge("3550308"));
        clientes.persistAndFlush(c); return c;
    }
    Endereco endereco(Cliente c) {
        Endereco e = new Endereco(); e.setCliente(c); e.setApelido("Casa"); e.setDestinatario(c.getNome()); e.setCep(c.getCep());
        e.setLogradouro(c.getLogradouro()); e.setBairro(c.getBairro()); e.setNumero(c.getNumero()); e.setMunicipio(c.getMunicipio()); e.setPrincipal(true);
        enderecos.persistAndFlush(e); return e;
    }
    @AfterEach void limpar() {
        QuarkusTransaction.requiringNew().run(() -> {
            for (Pedido p : pedidos.find("cliente.id in ?1", List.of(clienteId, outroClienteId)).withLock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE).list()) {
                em.createQuery("delete from EventoPedido where pedido.id = :id").setParameter("id",p.getId()).executeUpdate();
                pagamentos.delete("pedido.id", p.getId()); em.createQuery("delete from ItemPedido where pedido.id = :id").setParameter("id", p.getId()).executeUpdate(); pedidos.deleteById(p.getId());
            }
            mouses.deleteById(mouseId); mouses.deleteById(segundoMouseId); marcas.deleteById(marcaId);
            clientes.deleteById(clienteId); clientes.deleteById(outroClienteId);
        });
    }
    Map<String, Object> item(long id, int quantidade, String preco) { return Map.of("idMouse", id, "quantidade", quantidade, "precoEsperado", preco); }
    Map<String, Object> compra() { return new HashMap<>(Map.of("chaveCheckout", UUID.randomUUID().toString(), "idEndereco", enderecoId,
        "itens", List.of(item(mouseId, 1, "100.00")), "freteEsperado", "29.90")); }
    long criar(Map<String, Object> dto) { return given().contentType("application/json").body(dto).post("/pedidos").then().statusCode(201).extract().jsonPath().getLong("id"); }
    int estoque() { return QuarkusTransaction.requiringNew().call(() -> mouses.findById(mouseId).getQuantidadeEstoque()); }
    void vencer(long id) { QuarkusTransaction.requiringNew().run(() -> { var p = pedidos.findById(id); p.setCriadoEm(Instant.now().minusSeconds(7200)); p.setExpiraEm(Instant.now().minusSeconds(3600)); }); }
    Map<String,Object> pagamento(String chave, int resultado) { return Map.of("chaveIdempotencia", chave, "forma", 1, "resultadoSimulado", resultado); }

    @Test void revisaoIdempotenciaSnapshotEPropriedade() {
        var dto = compra();
        given().contentType("application/json").body(dto).post("/pedidos/revisao").then().statusCode(200).body("total", is(129.90f));
        long id = criar(dto); assertEquals(4, estoque());
        assertEquals(id, criar(dto)); assertEquals(4, estoque());
        QuarkusTransaction.requiringNew().run(() -> { mouses.findById(mouseId).setPreco(new BigDecimal("200")); enderecos.deleteById(enderecoId); });
        assertEquals(id, criar(dto));
        given().get("/pedidos/" + id).then().statusCode(200).body("itens[0].precoUnitario", is(100.0f)).body("endereco.numero", is("10"));
        dto.put("freteEsperado", "30.00");
        given().contentType("application/json").body(dto).post("/pedidos").then().statusCode(409);
        var outro = compra(); outro.put("idEndereco", outroEnderecoId);
        given().contentType("application/json").body(outro).post("/pedidos").then().statusCode(404);
        QuarkusTransaction.requiringNew().run(() -> pedidos.findById(id).setCliente(clientes.findById(outroClienteId)));
        given().get("/pedidos/" + id).then().statusCode(404);
        given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(), 1)).post("/pedidos/" + id + "/pagamentos").then().statusCode(404);
    }
    @Test void rejeitaPrecoFreteDuplicadosEEstoqueSemEfeitoParcial() {
        var dto = compra(); dto.put("itens", List.of(item(mouseId, 1, "99.00")));
        given().contentType("application/json").body(dto).post("/pedidos").then().statusCode(409).body("detail", containsString("preço"));
        dto = compra(); dto.put("freteEsperado", "0.00"); given().contentType("application/json").body(dto).post("/pedidos").then().statusCode(409);
        dto = compra(); dto.put("itens", List.of(item(mouseId, 1, "100"), item(segundoMouseId, 99, "100")));
        given().contentType("application/json").body(dto).post("/pedidos").then().statusCode(409); assertEquals(5, estoque());
        dto = compra(); dto.put("itens", List.of(item(mouseId, 1, "100"), item(mouseId, 1, "100")));
        given().contentType("application/json").body(dto).post("/pedidos").then().statusCode(400);
        QuarkusTransaction.requiringNew().run(() -> marcas.findById(marcaId).setAtivo(false));
        given().contentType("application/json").body(compra()).post("/pedidos").then().statusCode(409); assertEquals(5, estoque());
    }
    @Test void pagamentoRecusadoNovaTentativaAprovacaoIdempotenteECancelamentoInvalido() {
        long id = criar(compra()); String recusado = UUID.randomUUID().toString(), aprovado = UUID.randomUUID().toString();
        given().contentType("application/json").body(pagamento(recusado,2)).post("/pedidos/" + id + "/pagamentos").then().statusCode(200).body("status.id",is(1)).body("pagamentos[0].status.id",is(3));
        for(int i=0;i<2;i++) given().contentType("application/json").body(pagamento(aprovado,1)).post("/pedidos/" + id + "/pagamentos").then().statusCode(200).body("status.id",is(2)).body("pagamentos.size()",is(2));
        given().contentType("application/json").body(pagamento(aprovado,2)).post("/pedidos/" + id + "/pagamentos").then().statusCode(409);
        given().post("/pedidos/"+id+"/cancelamento").then().statusCode(409); assertEquals(4,estoque());
    }
    @Test void tentativaPendenteResolucaoEExpiracaoRestauramUmaVez() {
        long id = criar(compra()); String chave=UUID.randomUUID().toString();
        long pag = given().contentType("application/json").body(pagamento(chave,3)).post("/pedidos/"+id+"/pagamentos").then().statusCode(200).extract().jsonPath().getLong("pagamentos[0].id");
        given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),1)).post("/pedidos/"+id+"/pagamentos").then().statusCode(409);
        vencer(id);
        given().contentType("application/json").body(Map.of("resultado",1)).post("/pedidos/"+id+"/pagamentos/"+pag+"/simular").then().statusCode(200).body("status.id",is(6)).body("pagamentos[0].status.id",is(4));
        service.expirarVencidos(); given().post("/pedidos/"+id+"/cancelamento").then().statusCode(200).body("status.id",is(6)); assertEquals(5,estoque());
    }
    @Test void cancelamentoRepetidoESimulacaoPendenteConcluida() {
        long id = criar(compra());
        for(int i=0;i<2;i++) given().post("/pedidos/"+id+"/cancelamento").then().statusCode(200).body("status.id",is(5)); assertEquals(5,estoque());
        long segundo = criar(compra());
        long pag = given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),3)).post("/pedidos/"+segundo+"/pagamentos").then().statusCode(200).extract().jsonPath().getLong("pagamentos[0].id");
        for(int i=0;i<2;i++) given().contentType("application/json").body(Map.of("resultado",1)).post("/pedidos/"+segundo+"/pagamentos/"+pag+"/simular").then().statusCode(200).body("status.id",is(2)); assertEquals(4,estoque());
    }
    @Test
    @TestSecurity(user = "checkout", roles = "customer")
    @OidcSecurity(claims = {@Claim(key = "sub", value = "checkout-a")})
    void clienteSolicitaPagamentoMasNaoAprovaNemRecusa() {
        long id = criar(compra());
        for (int resultado : List.of(1, 2))
            given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(), resultado))
                .post("/pedidos/" + id + "/pagamentos").then().statusCode(403);
        given().get("/pedidos/" + id).then().statusCode(200).body("status.id", is(1)).body("pagamentos.size()", is(0));
        long pag = given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(), 3))
            .post("/pedidos/" + id + "/pagamentos").then().statusCode(200)
            .body("status.id", is(1)).body("pagamentos[0].status.id", is(1)).extract().jsonPath().getLong("pagamentos[0].id");
        for (int resultado : List.of(1, 2))
            given().contentType("application/json").body(Map.of("resultado", resultado))
                .post("/pedidos/" + id + "/pagamentos/" + pag + "/simular").then().statusCode(403);
        given().get("/pedidos/" + id).then().statusCode(200).body("status.id", is(1)).body("pagamentos[0].status.id", is(1));
        assertEquals(4, estoque());
    }
    @Test void duasComprasConcorrentesNaoVendemOUltimoItemDuasVezes() throws Exception {
        QuarkusTransaction.requiringNew().run(() -> mouses.findById(mouseId).setQuantidadeEstoque(1));
        var pool = Executors.newFixedThreadPool(2); var barreira = new CyclicBarrier(2);
        try {
            Callable<Integer> chamada=()->{barreira.await();return given().contentType("application/json").body(compra()).post("/pedidos").statusCode();};
            var a=pool.submit(chamada);var b=pool.submit(chamada);
            assertEquals(List.of(201,409),java.util.stream.Stream.of(a.get(30,TimeUnit.SECONDS),b.get(30,TimeUnit.SECONDS)).sorted().toList()); assertEquals(0,estoque());
        } finally {pool.shutdownNow();}
    }
    @Test void checkoutConcorrenteMesmaChaveEPagamentoConcorrenteDeduplicados() throws Exception {
        var dto=compra(); var pool=Executors.newFixedThreadPool(2); var barreira=new CyclicBarrier(2);
        try {
            Callable<Long> chamada=()->{barreira.await();return criar(dto);};var a=pool.submit(chamada);var b=pool.submit(chamada);
            long id=a.get(30,TimeUnit.SECONDS); assertEquals(id,b.get(30,TimeUnit.SECONDS)); assertEquals(4,estoque());
            var pagamento=pagamento(UUID.randomUUID().toString(),1);
            Callable<Integer> pagar=()->{barreira.await();return given().contentType("application/json").body(pagamento).post("/pedidos/"+id+"/pagamentos").then().statusCode(200).extract().jsonPath().getInt("pagamentos.size()");};
            var x=pool.submit(pagar);var y=pool.submit(pagar);assertEquals(1,x.get(30,TimeUnit.SECONDS));assertEquals(1,y.get(30,TimeUnit.SECONDS));
        }finally{pool.shutdownNow();}
    }
    @Test void rotinaPeriodicaExpiraPedidoSemLeituraDoCliente() throws Exception {
        long id=criar(compra());vencer(id);
        for(int n=0;n<100;n++) {if(QuarkusTransaction.requiringNew().call(()->pedidos.findById(id).getStatus())==StatusPedido.EXPIRADO)break;Thread.sleep(100);}
        assertEquals(StatusPedido.EXPIRADO,QuarkusTransaction.requiringNew().call(()->pedidos.findById(id).getStatus()));assertEquals(5,estoque());
    }
    @Test void aprovacaoConcorrenteComExpiracaoNuncaPagaPedidoVencido() throws Exception {
        long id = criar(compra());
        long pag = given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),3))
            .post("/pedidos/"+id+"/pagamentos").then().statusCode(200).extract().jsonPath().getLong("pagamentos[0].id");
        vencer(id); var pool=Executors.newFixedThreadPool(2); var barreira=new CyclicBarrier(2);
        try {
            var a=pool.submit(()->{barreira.await();service.expirarVencidos();return true;});
            var b=pool.submit(()->{barreira.await();return given().contentType("application/json").body(Map.of("resultado",1))
                .post("/pedidos/"+id+"/pagamentos/"+pag+"/simular").then().statusCode(200).extract().jsonPath().getInt("status.id");});
            assertTrue(a.get(30,TimeUnit.SECONDS));assertEquals(6,b.get(30,TimeUnit.SECONDS));assertEquals(5,estoque());
        } finally {pool.shutdownNow();}
    }

    @Test void administracaoDeOutroClienteRespeitaVersaoEPercorreEntregaSemDuplicarEventos() {
        long id=criar(compra());
        long pag=given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),3)).post("/pedidos/"+id+"/pagamentos").then().statusCode(200).extract().jsonPath().getLong("pagamentos[0].id");
        QuarkusTransaction.requiringNew().run(()->pedidos.findById(id).setCliente(clientes.findById(outroClienteId)));
        given().get("/pedidos/"+id).then().statusCode(404);
        var detalhe=given().get("/admin/pedidos/"+id).then().statusCode(200).body("idCliente",is((int)outroClienteId)).extract().jsonPath();
        long versao=detalhe.getLong("pedido.versao");
        given().contentType("application/json").body(Map.of("versao",versao+10,"resultado",1)).post("/admin/pedidos/"+id+"/pagamentos/"+pag+"/decisao").then().statusCode(409);
        var pago=given().contentType("application/json").body(Map.of("versao",versao,"resultado",1)).post("/admin/pedidos/"+id+"/pagamentos/"+pag+"/decisao").then().statusCode(200).body("pedido.status.id",is(2)).body("pedido.eventos.size()",is(2)).extract().jsonPath();
        given().contentType("application/json").body(Map.of("versao",versao,"resultado",1)).post("/admin/pedidos/"+id+"/pagamentos/"+pag+"/decisao").then().statusCode(200).body("pedido.eventos.size()",is(2));
        long atual=pago.getLong("pedido.versao");
        given().contentType("application/json").body(Map.of("versao",versao,"transportadora","Correios","codigoRastreio","BR123456789BR")).post("/admin/pedidos/"+id+"/envio").then().statusCode(409);
        var envio=Map.of("versao",atual,"transportadora","Correios","codigoRastreio","BR123456789BR");
        long enviado=given().contentType("application/json").body(envio).post("/admin/pedidos/"+id+"/envio").then().statusCode(200).body("pedido.status.id",is(3)).body("pedido.codigoRastreio",is("BR123456789BR")).body("pedido.eventos.size()",is(3)).extract().jsonPath().getLong("pedido.versao");
        given().contentType("application/json").body(envio).post("/admin/pedidos/"+id+"/envio").then().statusCode(200).body("pedido.eventos.size()",is(3));
        for(int n=0;n<2;n++)given().contentType("application/json").body(Map.of("versao",enviado)).post("/admin/pedidos/"+id+"/entrega").then().statusCode(200).body("pedido.status.id",is(4)).body("pedido.eventos.size()",is(4)).body("pedido.entregueEm",notNullValue());
        assertEquals(4,estoque());
    }
    @Test void recusaAdministrativaPermiteNovaTentativaECancelamentoRestauraUmaVez(){
        long id=criar(compra());
        var pendente=given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),3)).post("/pedidos/"+id+"/pagamentos").then().statusCode(200).extract().jsonPath();
        long versao=pendente.getLong("versao"),pag=pendente.getLong("pagamentos[0].id");
        var recusado=given().contentType("application/json").body(Map.of("versao",versao,"resultado",2)).post("/admin/pedidos/"+id+"/pagamentos/"+pag+"/decisao").then().statusCode(200).body("pedido.status.id",is(1)).body("pedido.pagamentos[0].status.id",is(3)).extract().jsonPath();
        assertTrue(recusado.getLong("pedido.versao")>versao);
        given().contentType("application/json").body(Map.of("versao",recusado.getLong("pedido.versao"),"transportadora","Correios","codigoRastreio","BR123")).post("/admin/pedidos/"+id+"/envio").then().statusCode(409);
        var novo=given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),3)).post("/pedidos/"+id+"/pagamentos").then().statusCode(200).body("pagamentos.size()",is(2)).extract().jsonPath();
        for(int n=0;n<2;n++)given().contentType("application/json").body(Map.of("versao",novo.getLong("versao"))).post("/admin/pedidos/"+id+"/cancelamento").then().statusCode(200).body("pedido.status.id",is(5)).body("pedido.pagamentos[1].status.id",is(4));
        assertEquals(5,estoque());
    }
    @Test @TestSecurity(user="checkout",roles="customer") @OidcSecurity(claims={@Claim(key="sub",value="checkout-a")})
    void historicoEhPaginadoEExclusivoDaContaEAdministracaoEhProtegida(){
        long id=criar(compra()),outro=criar(compra());
        QuarkusTransaction.requiringNew().run(()->pedidos.findById(outro).setCliente(clientes.findById(outroClienteId)));
        given().get("/pedidos/me?page=0&pageSize=1").then().statusCode(200).body("totalItems",is(1)).body("items[0].id",is((int)id)).body("items[0].eventos[0].descricao",is("Pedido recebido."));
        given().get("/pedidos/"+outro).then().statusCode(404);
        given().get("/pedidos/me?pageSize=101").then().statusCode(400);
        for(String path:List.of("/admin/pedidos","/admin/pedidos/indicadores","/admin/pedidos/"+outro))given().get(path).then().statusCode(403);
        for(String path:List.of("envio","entrega","cancelamento","pagamentos/1/decisao"))given().contentType("application/json").body(Map.of("versao",0,"resultado",1,"transportadora","Correios","codigoRastreio","BR123" )).post("/admin/pedidos/"+id+"/"+path).then().statusCode(403);
    }
    @Test void indicadoresUsamPagamentosAprovadosEFiltrosSaoValidados(){
        BigDecimal antes=given().get("/admin/pedidos/indicadores").then().statusCode(200).extract().jsonPath().getObject("faturamentoMes",BigDecimal.class);
        long id=criar(compra());
        given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),1)).post("/pedidos/"+id+"/pagamentos").then().statusCode(200);
        BigDecimal depois=given().get("/admin/pedidos/indicadores").then().statusCode(200).body("mousesAtivos",greaterThanOrEqualTo(2)).body("clientesCadastrados",greaterThanOrEqualTo(2)).extract().jsonPath().getObject("faturamentoMes",BigDecimal.class);
        assertEquals(0,new BigDecimal("129.90").compareTo(depois.subtract(antes)));
        given().queryParam("busca","#"+id).queryParam("status",2).queryParam("ordenar","cliente").queryParam("pageSize",1).get("/admin/pedidos").then().statusCode(200).body("totalItems",is(1)).body("items[0].id",is((int)id));
        given().get("/admin/pedidos?ordenar=invalid").then().statusCode(400);given().get("/admin/pedidos?status=7").then().statusCode(400);
        given().get("/clientes/pagina?busca=Comprador&ordenar=email-desc&pageSize=1").then().statusCode(200).body("items.size()",is(1)).body("totalItems",greaterThanOrEqualTo(2));
        given().get("/mouses/pagina?ordenar=preco-desc&pageSize=1").then().statusCode(200).body("items.size()",is(1));
        given().get("/marcas/pagina?ordenar=nome-desc").then().statusCode(200);
        given().get("/clientes/pagina?ordenar=invalid").then().statusCode(400);
    }
    @Test void historicoImpedeExclusaoMasPermiteDesativarProduto(){
        long id=criar(compra());
        given().delete("/mouses/"+mouseId).then().statusCode(400).body("detail",containsString("pedidos"));
        given().delete("/clientes/"+clienteId).then().statusCode(400).body("detail",containsString("pedidos"));
        QuarkusTransaction.requiringNew().run(()->{mouses.findById(mouseId).setAtivo(false);marcas.findById(marcaId).setAtivo(false);});
        given().get("/pedidos/"+id).then().statusCode(200).body("itens[0].nome",is("Mouse checkout")).body("itens[0].marca",startsWith("Checkout "));
    }
    @Test void desejosSaoIdempotentesPersistidosEIsoladosPorSubject(){
        for(int n=0;n<2;n++)given().put("/desejos/"+mouseId).then().statusCode(204);
        given().get("/desejos/ids").then().statusCode(200).body("size()",is(1));
        given().get("/desejos?pageSize=1").then().statusCode(200).body("totalItems",is(1)).body("items[0].produto.id",is((int)mouseId)).body("items[0].disponivel",is(true));
        QuarkusTransaction.requiringNew().run(()->mouses.findById(mouseId).setAtivo(false));
        given().get("/desejos").then().statusCode(200).body("items[0].disponivel",is(false));
        QuarkusTransaction.requiringNew().run(()->em.createQuery("update Desejo set identidadeSubject = 'checkout-b' where mouse.id = :id").setParameter("id",mouseId).executeUpdate());
        given().get("/desejos/ids").then().statusCode(200).body("size()",is(0));
        given().delete("/desejos/"+mouseId).then().statusCode(204);
        assertEquals(1,QuarkusTransaction.requiringNew().call(()->em.createQuery("select count(d) from Desejo d where mouse.id = :id",Long.class).setParameter("id",mouseId).getSingleResult()));
        QuarkusTransaction.requiringNew().run(()->em.createQuery("delete from Desejo where mouse.id = :id").setParameter("id",mouseId).executeUpdate());
    }

    @Test void decisoesAdministrativasConcorrentesNaoSobrescrevemOResultado() throws Exception {
        long id=criar(compra());var pendente=given().contentType("application/json").body(pagamento(UUID.randomUUID().toString(),3)).post("/pedidos/"+id+"/pagamentos").then().statusCode(200).extract().jsonPath();
        long pag=pendente.getLong("pagamentos[0].id"),versao=pendente.getLong("versao");
        var pool=Executors.newFixedThreadPool(2);var barreira=new CyclicBarrier(2);
        try {
            var a=pool.submit(()->{barreira.await();return given().contentType("application/json").body(Map.of("versao",versao,"resultado",1)).post("/admin/pedidos/"+id+"/pagamentos/"+pag+"/decisao").statusCode();});
            var b=pool.submit(()->{barreira.await();return given().contentType("application/json").body(Map.of("versao",versao,"resultado",2)).post("/admin/pedidos/"+id+"/pagamentos/"+pag+"/decisao").statusCode();});
            assertEquals(List.of(200,409),java.util.stream.Stream.of(a.get(30,TimeUnit.SECONDS),b.get(30,TimeUnit.SECONDS)).sorted().toList());
            given().get("/admin/pedidos/"+id).then().statusCode(200).body("pedido.eventos.size()",is(2));assertEquals(4,estoque());
        }finally{pool.shutdownNow();}
    }
    @Test void desejosConcorrentesNaoDuplicamProduto() throws Exception {
        var pool=Executors.newFixedThreadPool(2);var barreira=new CyclicBarrier(2);
        try{Callable<Integer> chamada=()->{barreira.await();return given().put("/desejos/"+mouseId).statusCode();};var a=pool.submit(chamada);var b=pool.submit(chamada);assertEquals(204,a.get(30,TimeUnit.SECONDS));assertEquals(204,b.get(30,TimeUnit.SECONDS));given().get("/desejos/ids").then().statusCode(200).body("size()",is(1));}finally{pool.shutdownNow();}
    }

}
