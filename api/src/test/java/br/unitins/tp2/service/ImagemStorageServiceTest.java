package br.unitins.tp2.service;

import static org.junit.jupiter.api.Assertions.*;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import br.unitins.tp2.config.R2Config;
import br.unitins.tp2.exception.ArmazenamentoException;
import br.unitins.tp2.exception.ValidationException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;

class ImagemStorageServiceTest {
    @TempDir Path temp;
    static final byte[] PNG = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBxkAAAAASUVORK5CYII=");

    @Test void rejectsEmptyOversizeAndDisguisedFiles() throws Exception {
        Path file = temp.resolve("file.png");
        Files.write(file, new byte[0]);
        assertThrows(ValidationException.class, () -> ImagemStorageServiceImpl.validarArquivo(file, "image/png"));
        Files.write(file, new byte[(int) ImagemStorageServiceImpl.MAX_BYTES + 1]);
        assertThrows(ValidationException.class, () -> ImagemStorageServiceImpl.validarArquivo(file, "image/png"));
        Files.writeString(file, "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
        assertThrows(ValidationException.class, () -> ImagemStorageServiceImpl.validarArquivo(file, "image/png"));
        Files.write(file, PNG);
        assertEquals("png", ImagemStorageServiceImpl.validarArquivo(file, "image/png"));
        assertThrows(ValidationException.class, () -> ImagemStorageServiceImpl.validarArquivo(file, "image/jpeg"));
        assertThrows(ValidationException.class, () -> ImagemStorageServiceImpl.validarArquivo(file, "image/svg+xml"));
        assertThrows(ValidationException.class, () -> ImagemStorageServiceImpl.validarArquivo(null, "image/png"));
    }

    @Test void sendsBytesToConfiguredBucketAndUsesUniquePublicUrls() throws Exception {
        Path file = Files.write(temp.resolve("unsafe-name.png"), PNG);
        AtomicReference<PutObjectRequest> sent = new AtomicReference<>();
        ImagemStorageServiceImpl service = service(true);
        setClient(service, (S3Client) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[]{S3Client.class}, (proxy, method, args) -> {
            if (method.getName().equals("putObject")) {
                sent.set((PutObjectRequest) args[0]);
                try (var stream = ((RequestBody) args[1]).contentStreamProvider().newStream()) { assertArrayEquals(PNG, stream.readAllBytes()); }
                return PutObjectResponse.builder().build();
            }
            return null;
        }));
        String first = service.enviar("marcas", file, "image/png").url();
        assertTrue(first.matches("https://images.example.com/marcas/[a-f0-9-]+\\.png"));
        assertEquals("catalog", sent.get().bucket());
        assertEquals("image/png", sent.get().contentType());
        assertEquals("public, max-age=31536000, immutable", sent.get().cacheControl());
        assertNotEquals(first, service.enviar("marcas", file, "image/png").url());
        assertTrue(service.enviar("mouses", file, "image/png").url().contains("/mouses/"));
        assertThrows(ValidationException.class, () -> service.enviar("../other", file, "image/png"));
    }

    @Test void disabledStorageAndProviderFailuresDoNotExposeSecrets() throws Exception {
        Path file = Files.write(temp.resolve("image.png"), PNG);
        assertThrows(ArmazenamentoException.class, () -> service(false).enviar("marcas", file, "image/png"));
        var service = service(true);
        setClient(service, (S3Client) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[]{S3Client.class}, (proxy, method, args) -> {
            throw S3Exception.builder().message("secret-access-key=private-value").statusCode(403).build();
        }));
        var error = assertThrows(ArmazenamentoException.class, () -> service.enviar("mouses", file, "image/png"));
        assertFalse(error.getMessage().contains("private-value"));
        assertNull(error.getCause());
    }

    @Test void rejectsInvalidStorageEndpoints() {
        for (String url : new String[]{"http://images.example.com", "https://user:pass@images.example.com", "https://images.example.com?token=secret", "https://images.example.com/#fragment"}) {
            assertThrows(IllegalArgumentException.class, () -> ImagemStorageServiceImpl.validarUrl(url, false));
        }
        assertThrows(IllegalArgumentException.class, () -> ImagemStorageServiceImpl.validarUrl("https://example.com/bucket", true));
    }

    private ImagemStorageServiceImpl service(boolean enabled) {
        var service = new ImagemStorageServiceImpl();
        service.config = new R2Config() {
            public boolean enabled() { return enabled; }
            public Optional<String> endpoint() { return Optional.of("https://account.r2.cloudflarestorage.com"); }
            public Optional<String> bucket() { return Optional.of("catalog"); }
            public Optional<String> accessKeyId() { return Optional.of("test-key"); }
            public Optional<String> secretAccessKey() { return Optional.of("test-secret"); }
            public Optional<String> publicUrl() { return Optional.of("https://images.example.com/"); }
        };
        return service;
    }

    private void setClient(ImagemStorageServiceImpl service, S3Client client) throws Exception {
        var field = ImagemStorageServiceImpl.class.getDeclaredField("client");
        field.setAccessible(true);
        field.set(service, client);
    }
}
