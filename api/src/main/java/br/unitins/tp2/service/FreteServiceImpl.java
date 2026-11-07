package br.unitins.tp2.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import br.unitins.tp2.dto.FreteResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import br.unitins.tp2.model.Municipio;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class FreteServiceImpl implements FreteService {
    @ConfigProperty(name = "frete.valor-padrao", defaultValue = "29.90") BigDecimal valorPadrao;
    @ConfigProperty(name = "frete.prazo-dias-uteis", defaultValue = "5") int prazoPadrao;

    @Override
    public FreteResponseDTO calcular(String cep, Municipio municipio) {
        String normalizado = cep == null ? null : cep.replace("-", "").strip();
        if (normalizado == null || !normalizado.matches("[0-9]{8}")) {
            throw new ValidationException("cep", "Informe um CEP com oito dígitos.");
        }
        BigDecimal valor = (valorPadrao == null || valorPadrao.signum() < 0
                ? new BigDecimal("29.90") : valorPadrao).setScale(2, RoundingMode.HALF_UP);
        // Public estimates know only the postcode; checkout supplies the owned saved municipality.
        return new FreteResponseDTO(normalizado, municipio == null ? "" : municipio.getNome(),
                municipio == null ? "" : municipio.getEstado().getSigla(), valor, Math.max(1, prazoPadrao));
    }
}
