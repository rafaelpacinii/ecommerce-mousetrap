package br.unitins.tp2.exception;

public class AutenticacaoException extends RuntimeException {
    private final int status;
    private final String title;

    public AutenticacaoException(int status, String title, String detail) {
        super(detail);
        this.status = status;
        this.title = title;
    }

    public int status() {
        return status;
    }

    public String title() {
        return title;
    }
}
