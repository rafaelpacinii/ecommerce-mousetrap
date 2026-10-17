package br.unitins.tp2.dto;

import java.util.List;
import br.unitins.tp2.model.*;

public record CatalogoFacetasResponseDTO(List<MarcaResponseDTO> marcas, List<String> sensores,
        List<Integer> pollingRates, List<TipoConexao> conexoes, List<Pegada> pegadas, List<TipoSwitch> tiposSwitch) {}
