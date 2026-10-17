package br.unitins.tp2.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.dto.FreteResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ServiceUnavailableException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class CepServiceImpl implements CepService {
    @Inject ObjectMapper mapper;
    @ConfigProperty(name = "viacep.url", defaultValue = "https://viacep.com.br/ws/") String url;
    @ConfigProperty(name = "frete.valor-padrao", defaultValue = "29.90") BigDecimal valorFretePadrao;
    @ConfigProperty(name = "frete.prazo-dias-uteis", defaultValue = "5") int prazoDiasUteisPadrao;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Override
    public CepResponseDTO consultar(String cep) {
        if (cep == null || !cep.matches("[0-9]{8}"))
            throw new ValidationException("cep", "Informe um CEP com oito dígitos.");
        try {
            var request = HttpRequest.newBuilder(URI.create(url + cep + "/json/"))
                    .timeout(Duration.ofSeconds(8)).header("Accept", "application/json").GET().build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new ServiceUnavailableException();
            var json = mapper.readTree(response.body());
            if (json.path("erro").asBoolean()) throw new ValidationException("cep", "CEP não encontrado.");
            String ibge = json.path("ibge").asText();
            String uf = json.path("uf").asText();
            String cidade = json.path("localidade").asText();
            if (!ibge.matches("[0-9]{7}") || !uf.matches("[A-Z]{2}") || (cidade.isBlank() || cidade.length() > 150)
                    || !cep.equals(json.path("cep").asText().replace("-", "")))
                throw new ServiceUnavailableException();
            return new CepResponseDTO(cep, json.path("logradouro").asText(), json.path("bairro").asText(), cidade, uf, ibge);
        } catch (ValidationException | ServiceUnavailableException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ServiceUnavailableException();
        } catch (Exception e) {
            throw new ServiceUnavailableException();
        }
    }

    @Override
    public FreteResponseDTO calcularFrete(String cep) {
        String normalizado = cep == null ? null : cep.replace("-", "").strip();
        CepResponseDTO dados = consultar(normalizado);
        BigDecimal valor = (valorFretePadrao == null || valorFretePadrao.compareTo(BigDecimal.ZERO) < 0
                ? new BigDecimal("29.90")
                : valorFretePadrao).setScale(2, RoundingMode.HALF_UP);
        int prazo = Math.max(1, prazoDiasUteisPadrao);
        return new FreteResponseDTO(dados.cep(), dados.localidade(), dados.uf(), valor, prazo);
    }
}
