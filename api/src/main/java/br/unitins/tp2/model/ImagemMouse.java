package br.unitins.tp2.model;

import jakarta.persistence.*;

@Entity
@Table(name = "imagem_mouse", uniqueConstraints = @UniqueConstraint(columnNames = {"mouse_id", "ordem"}))
public class ImagemMouse extends DefaultEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mouse_id", nullable = false)
    private Mouse mouse;
    @Column(nullable = false, length = 2048)
    private String url;
    @Column(name = "texto_alternativo", nullable = false, length = 200)
    private String textoAlternativo;
    @Column(nullable = false)
    private Integer ordem;

    public Mouse getMouse() { return mouse; }
    public void setMouse(Mouse mouse) { this.mouse = mouse; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getTextoAlternativo() { return textoAlternativo; }
    public void setTextoAlternativo(String textoAlternativo) { this.textoAlternativo = textoAlternativo; }
    public Integer getOrdem() { return ordem; }
    public void setOrdem(Integer ordem) { this.ordem = ordem; }
}
