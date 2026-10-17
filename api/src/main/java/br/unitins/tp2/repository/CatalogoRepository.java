package br.unitins.tp2.repository;

import br.unitins.tp2.dto.CatalogoFiltroDTO;
import br.unitins.tp2.model.*;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;

@ApplicationScoped
public class CatalogoRepository implements PanacheRepository<Mouse> {
    private static final String PUBLICO = "m.ativo = true and m.marca.ativo = true";
    private static final Map<String, String> ORDENS = Map.of(
            "nome", "lower(m.nome) asc, m.id asc", "menor-preco", "m.preco asc, m.id asc",
            "maior-preco", "m.preco desc, m.id asc", "menor-peso", "m.pesoGramas asc, m.id asc",
            "maior-dpi", "m.dpiMaximo desc, m.id asc", "recentes", "m.dataCadastro desc, m.id desc");

    public static boolean ordenacaoValida(String ordenar) { return ORDENS.containsKey(ordenar); }

    public PanacheQuery<Mouse> consultar(CatalogoFiltroDTO filtro) {
        var query = new StringBuilder("from Mouse m where " + PUBLICO);
        Map<String, Object> parametros = new HashMap<>();
        if (filtro.nome() != null && !filtro.nome().isBlank()) {
            query.append(" and locate(:nome, lower(m.nome)) > 0");
            parametros.put("nome", filtro.nome().strip().toLowerCase(Locale.ROOT));
        }
        if (filtro.marcas() != null && !filtro.marcas().isEmpty()) {
            query.append(" and m.marca.id in :marcas"); parametros.put("marcas", filtro.marcas());
        }
        if (filtro.sensor() != null && !filtro.sensor().isBlank()) {
            query.append(" and lower(m.sensor) = :sensor"); parametros.put("sensor", filtro.sensor().strip().toLowerCase(Locale.ROOT));
        }
        if (filtro.conexoes() != null && !filtro.conexoes().isEmpty()) {
            query.append(" and exists (select 1 from Mouse c join c.tiposConexao tipo where c.id = m.id and tipo in :conexoes)");
            parametros.put("conexoes", filtro.conexoes().stream().map(TipoConexao::valueOf).toList());
        }
        if (filtro.pegadas() != null && !filtro.pegadas().isEmpty()) {
            query.append(" and exists (select 1 from Mouse p join p.pegadas pegada where p.id = m.id and pegada in :pegadas)");
            parametros.put("pegadas", filtro.pegadas().stream().map(Pegada::valueOf).toList());
        }
        if (filtro.pollingRateMin() != null) { query.append(" and m.pollingRate >= :polling"); parametros.put("polling", filtro.pollingRateMin()); }
        if (filtro.tipoSwitch() != null) { query.append(" and m.tipoSwitch = :switch"); parametros.put("switch", TipoSwitch.valueOf(filtro.tipoSwitch())); }
        if (filtro.pesoMax() != null) { query.append(" and m.pesoGramas <= :peso"); parametros.put("peso", filtro.pesoMax()); }
        if (filtro.precoMin() != null) { query.append(" and m.preco >= :min"); parametros.put("min", filtro.precoMin()); }
        if (filtro.precoMax() != null) { query.append(" and m.preco <= :max"); parametros.put("max", filtro.precoMax()); }
        if (filtro.emEstoque()) query.append(" and m.quantidadeEstoque > 0");
        query.append(" order by ").append(ORDENS.get(filtro.ordenar()));
        return find(query.toString(), parametros);
    }

    public Mouse buscarPublico(Long id) { return find("from Mouse m where " + PUBLICO + " and m.id = ?1", id).firstResult(); }
    public List<Marca> marcasPublicas() {
        return getEntityManager().createQuery("select distinct m.marca from Mouse m where " + PUBLICO + " order by m.marca.nome", Marca.class).getResultList();
    }
    public List<String> sensoresPublicos() {
        return getEntityManager().createQuery("select distinct m.sensor from Mouse m where " + PUBLICO + " and m.sensor is not null order by m.sensor", String.class).getResultList();
    }
    public List<Integer> pollingRatesPublicos() {
        return getEntityManager().createQuery("select distinct m.pollingRate from Mouse m where " + PUBLICO + " and m.pollingRate is not null order by m.pollingRate", Integer.class).getResultList();
    }
}
