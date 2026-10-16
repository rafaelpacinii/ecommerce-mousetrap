package br.unitins.tp2.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.unitins.tp2.dto.CepResponseDTO;
import br.unitins.tp2.exception.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ServiceUnavailableException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class CepServiceImpl implements CepService {
    @Inject ObjectMapper mapper;
    @ConfigProperty(name = "viacep.url", defaultValue = "https://viacep.com.br/ws/") String url;
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
}
