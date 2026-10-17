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
    data: { description: 'Acompanhe seus pedidos e o andamento das entregas na MouseTrap.' },
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
    data: { description: 'Consulte o andamento da sua compra e acompanhe a entrega.' },
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
