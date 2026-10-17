package br.unitins.tp2.dto;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public record RevisaoPedidoDTO(@NotNull @Min(1) Long idEndereco,
        @NotEmpty @Size(max = 100) List<@NotNull @Valid ItemCheckoutDTO> itens) {}
