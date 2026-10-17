import { Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Pedido, dataPedido } from '../../../models/pedido.model';
@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetailsComponent {
  readonly pedido = input.required<Pedido>();
  readonly compact = input(false);
  readonly data = dataPedido;
  readonly etapas = ['Pedido recebido', 'Pagamento aprovado', 'Enviado', 'Entregue'];
  readonly etapa = computed(() => (this.pedido().status.id <= 4 ? this.pedido().status.id : 0));
}
