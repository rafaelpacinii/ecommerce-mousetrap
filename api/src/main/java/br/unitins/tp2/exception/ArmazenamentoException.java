package br.unitins.tp2.exception;

public class ArmazenamentoException extends RuntimeException {
    public ArmazenamentoException() {
        super("Envio de imagens indisponível. Verifique a configuração do armazenamento ou tente novamente.");
    }
}
