package br.unitins.tp2.dto;

import br.unitins.tp2.model.Sensor;

public record SensorResponseDTO(
        Long id,
        String modelo,
        String fabricante,
        Integer dpiMaximo,
        Integer ips,
        Integer aceleracaoG) {
    public static SensorResponseDTO valueOf(Sensor sensor) {
        if (sensor == null) {
            return null;
        }
        return new SensorResponseDTO(
                sensor.getId(),
                sensor.getModelo(),
                sensor.getFabricante(),
                sensor.getDpiMaximo(),
                sensor.getIps(),
                sensor.getAceleracaoG());
    }
}

