package br.unitins.tp2.service;

public interface KeycloakIdentityClient {
    record TokenSet(
            String accessToken,
            String refreshToken,
            long expiresIn,
            long refreshExpiresIn) {
    }

    TokenSet autenticar(String email, String senha);

    TokenSet renovar(String refreshToken);

    void encerrarSessao(String refreshToken);

    String criarUsuarioCliente(String nome, String email, String senha);

    void removerUsuario(String userId);
}
