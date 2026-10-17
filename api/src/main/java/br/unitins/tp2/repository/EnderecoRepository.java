package br.unitins.tp2.repository;

import java.util.List;
import br.unitins.tp2.model.Endereco;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class EnderecoRepository implements PanacheRepository<Endereco> {
    public List<Endereco> findByClienteId(Long clienteId) {
        return find("cliente.id = ?1 order by principal desc, id asc", clienteId).list();
    }

    public Endereco findByIdAndClienteId(Long id, Long clienteId) {
        return find("id = ?1 and cliente.id = ?2", id, clienteId).firstResult();
    }

    public Endereco findPrincipalByClienteId(Long clienteId) {
        return find("cliente.id = ?1 and principal = true", clienteId).firstResult();
    }

    public void desmarcarPrincipais(Long clienteId) {
        update("principal = false where cliente.id = ?1 and principal = true", clienteId);
    }
}

