package br.unitins.tp2.service;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.UUID;
import br.unitins.tp2.config.R2Config;
import br.unitins.tp2.dto.ImagemUploadResponseDTO;
import br.unitins.tp2.exception.ArmazenamentoException;
import br.unitins.tp2.exception.ValidationException;
import jakarta.annotation.PreDestroy;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@ApplicationScoped
@RolesAllowed("admin")
public class ImagemStorageServiceImpl implements ImagemStorageService {
    private static final Logger LOG = Logger.getLogger(ImagemStorageServiceImpl.class);
    public static final long MAX_BYTES = 5 * 1024 * 1024;
    @Inject R2Config config;
    private S3Client client;

    @Override
    public ImagemUploadResponseDTO enviar(String destino, Path arquivo, String contentType) {
        if (!"mouses".equals(destino) && !"marcas".equals(destino)) {
            throw new ValidationException("destino", "Selecione mouses ou marcas para o envio.");
        }
        String extensao = validarArquivo(arquivo, contentType);
        if (!config.enabled()) throw new ArmazenamentoException();
        try {
            String base = validarUrl(config.publicUrl().orElseThrow(), false).toString().replaceAll("/+$", "");
            String key = destino + "/" + UUID.randomUUID() + "." + extensao;
            cliente().putObject(PutObjectRequest.builder()
                    .bucket(config.bucket().orElseThrow()).key(key).contentType(contentType)
                    .cacheControl("public, max-age=31536000, immutable").build(), RequestBody.fromFile(arquivo));
            return new ImagemUploadResponseDTO(base + "/" + key);
        } catch (SdkException | IllegalArgumentException | java.util.NoSuchElementException e) {
            // Never log SDK exceptions: they can contain credentials or signed request details.
            LOG.warn("R2 image upload failed; check endpoint, bucket permissions and connectivity.");
            throw new ArmazenamentoException();
        }
    }

    static String validarArquivo(Path arquivo, String contentType) {
        if (arquivo == null) throw new ValidationException("arquivo", "Selecione uma imagem.");
        try {
            long size = Files.size(arquivo);
            if (size == 0 || size > MAX_BYTES) {
                throw new ValidationException("arquivo", "Envie uma imagem de até 5 MB, não vazia.");
            }
            byte[] head;
            try (var stream = Files.newInputStream(arquivo)) { head = stream.readNBytes(16); }
            String extension = null;
            if (head.length >= 8 && head[0] == (byte) 137 && head[1] == 80 && head[2] == 78
                    && head[3] == 71 && head[4] == 13 && head[5] == 10 && head[6] == 26 && head[7] == 10
                    && "image/png".equals(contentType)) extension = "png";
            if (head.length >= 3 && head[0] == (byte) 255 && head[1] == (byte) 216 && head[2] == (byte) 255
                    && "image/jpeg".equals(contentType)) extension = "jpg";
            if (head.length == 16 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                    && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P'
                    && head[12] == 'V' && head[13] == 'P' && head[14] == '8'
                    && "image/webp".equals(contentType)) extension = "webp";
            if (extension == null) throw new ValidationException("arquivo", "Use uma imagem PNG, JPEG ou WebP válida.");
            return extension;
        } catch (IOException e) { throw new ArmazenamentoException(); }
    }

    private synchronized S3Client cliente() {
        if (client == null) {
            client = S3Client.builder()
                    .endpointOverride(validarUrl(config.endpoint().orElseThrow(), true))
                    .region(Region.of("auto"))
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                            config.accessKeyId().orElseThrow(), config.secretAccessKey().orElseThrow())))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true)
                            .chunkedEncodingEnabled(false).build())
                    .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                    .httpClientBuilder(UrlConnectionHttpClient.builder().connectionTimeout(Duration.ofSeconds(5))
                            .socketTimeout(Duration.ofSeconds(30)))
                    .overrideConfiguration(c -> c.apiCallTimeout(Duration.ofSeconds(45)))
                    .build();
        }
        return client;
    }

    static URI validarUrl(String value, boolean endpoint) {
        URI uri = URI.create(value);
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
                || uri.getQuery() != null || uri.getFragment() != null
                || (endpoint && !uri.getPath().isEmpty() && !uri.getPath().equals("/"))) {
            throw new IllegalArgumentException("Invalid storage URL");
        }
        return uri;
    }

    @PreDestroy
    void fechar() { if (client != null) client.close(); }
}
