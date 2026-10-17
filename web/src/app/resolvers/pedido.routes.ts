import { Routes } from '@angular/router';
import { pedidoResolver, pedidoAdminResolver } from './pedido.resolver';
export const customerOrderRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/storefront/customer-portal/order-history').then(
        (m) => m.OrderHistoryComponent,
      ),
    title: 'Meus pedidos | MouseTrap',
  },
  {
    path: ':id',
    resolve: { pedido: pedidoResolver },
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('../components/storefront/customer-portal/customer-order').then(
        (m) => m.CustomerOrderComponent,
      ),
    title: 'Seu pedido | MouseTrap',
  },
];
export const adminOrderRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/pedidos/admin-orders').then((m) => m.AdminOrdersComponent),
    title: 'Gestão de pedidos | MouseTrap',
  },
  {
    path: ':id',
    resolve: { pedido: pedidoAdminResolver },
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('../components/pedidos/admin-order').then((m) => m.AdminOrderComponent),
    title: 'Gerenciar pedido | MouseTrap',
  },
];
