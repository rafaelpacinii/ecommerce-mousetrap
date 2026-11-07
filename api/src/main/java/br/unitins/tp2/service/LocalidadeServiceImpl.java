package br.unitins.tp2.service;

import java.util.List;
import br.unitins.tp2.dto.EstadoResponseDTO;
import br.unitins.tp2.dto.MunicipioResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.repository.EstadoRepository;
import br.unitins.tp2.repository.MunicipioRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class LocalidadeServiceImpl implements LocalidadeService {
    @Inject EstadoRepository estados;
    @Inject MunicipioRepository municipios;

    @Override
    public List<EstadoResponseDTO> estados() {
        return estados.listAll(io.quarkus.panache.common.Sort.by("nome"))
                .stream().map(EstadoResponseDTO::valueOf).toList();
    }

    @Override
    public List<MunicipioResponseDTO> municipios(String uf) {
        if (uf == null || !uf.matches("[A-Z]{2}") || estados.findBySigla(uf) == null) {
            throw new ValidationException("uf", "Selecione um estado válido.");
        }
        return municipios.findByUf(uf).stream().map(MunicipioResponseDTO::valueOf).toList();
    }
}
