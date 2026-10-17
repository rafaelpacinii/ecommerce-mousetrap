package br.unitins.tp2.dto;
import java.util.*;
import java.math.BigDecimal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public record PedidoDTO(@NotNull UUID chaveCheckout, @NotNull @Min(1) Long idEndereco,
        @NotEmpty @Size(max = 100) List<@NotNull @Valid ItemCheckoutDTO> itens,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal freteEsperado) {}
