package br.unitins.tp2.service;

import java.nio.file.Path;
import br.unitins.tp2.dto.ImagemUploadResponseDTO;

public interface ImagemStorageService {
    ImagemUploadResponseDTO enviar(String destino, Path arquivo, String contentType);
}
