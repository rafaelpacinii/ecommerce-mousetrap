import { authGuard, adminGuard } from './guards/auth.guard';
import { Routes } from '@angular/router';

import { produtoResolver } from './resolvers/produto.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/storefront-layout/storefront-layout').then(
        (m) => m.StorefrontLayoutComponent,
      ),
    children: [
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./components/storefront/catalog/catalog').then((m) => m.CatalogComponent),
        title: 'Catálogo de mouses | MouseTrap',
        data: {
          description:
            'Compare mouses gamer por marca, sensor, peso, conexão, pegada e preço. Encontre o desempenho ideal para o seu jogo.',
        },
      },
      {
        path: 'catalogo/:id',
        loadComponent: () =>
          import('./components/storefront/product-detail/product-detail').then(
            (m) => m.ProductDetailComponent,
          ),
        resolve: { produto: produtoResolver },
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'carrinho',
        loadComponent: () =>
          import('./components/storefront/cart/cart').then((m) => m.CartComponent),
        title: 'Seu carrinho | MouseTrap',
        data: {
          description:
            'Confira os itens do seu carrinho e calcule a entrega antes de finalizar a compra.',
        },
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./components/storefront/checkout/checkout').then((m) => m.CheckoutComponent),
        title: 'Checkout | MouseTrap',
        data: {
          description:
            'Revise sua compra, escolha o endereço de entrega e informe a forma de pagamento.',
        },
      },
      ...['login', 'cadastro', 'auth/callback', 'acesso-negado'].map((path) => ({
        path,
        data: {
          mode: path,
          description: 'Acesse sua conta MouseTrap para acompanhar compras e gerenciar seus dados.',
        },
        loadComponent: () => import('./components/auth/auth-page').then((m) => m.AuthPageComponent),
        title:
          path === 'cadastro'
            ? 'Criar conta | MouseTrap'
            : path === 'acesso-negado'
              ? 'Acesso restrito | MouseTrap'
              : 'Sua conta | MouseTrap',
      })),
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./components/storefront/home/home').then((m) => m.HomeComponent),
        title: 'MouseTrap | Precisão absoluta em cada clique',
      },
      {
        path: '',
        loadComponent: () =>
          import('./layouts/customer-portal-layout/customer-portal-layout').then(
            (m) => m.CustomerPortalLayoutComponent,
          ),
        children: [
          {
            path: 'meus-pedidos',
            canActivateChild: [authGuard],
            loadChildren: () =>
              import('./resolvers/pedido.routes').then((m) => m.customerOrderRoutes),
          },
          {
            path: 'lista-de-desejos',
            canActivate: [authGuard],
            loadComponent: () =>
              import('./components/storefront/customer-portal/wishlist').then(
                (m) => m.WishlistComponent,
              ),
            title: 'Lista de desejos | MouseTrap',
            data: { description: 'Guarde e consulte seus mouses favoritos na MouseTrap.' },
          },
          {
            matcher: (segments) =>
              segments.length === 1 && ['meus-dados', 'enderecos'].includes(segments[0].path)
                ? { consumed: segments, posParams: { secao: segments[0] } }
                : null,
            canActivate: [authGuard],
            data: {
              selfService: true,
              description: 'Consulte seus dados e gerencie seus endereços na MouseTrap.',
            },
            loadComponent: () =>
              import('./components/clientes/cliente-form/cliente-form').then(
                (m) => m.ClienteFormComponent,
              ),
            title: (route) =>
              route.paramMap.get('secao') === 'enderecos'
                ? 'Endereços | MouseTrap'
                : 'Meus dados | MouseTrap',
          },
        ],
      },
    ],
  },
  {
    path: 'admin',
    data: { description: 'Gerencie o catálogo, os clientes e os pedidos da MouseTrap.' },
    canActivateChild: [adminGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
    loadChildren: () => import('./resolvers/admin.routes').then((m) => m.adminRoutes),
  },
  ...['mouses', 'marcas', 'clientes'].flatMap((resource) => [
    { path: resource, pathMatch: 'full' as const, redirectTo: `admin/${resource}` },
    { path: `${resource}/novo`, redirectTo: `admin/${resource}/novo` },
    { path: `${resource}/editar/:id`, redirectTo: `admin/${resource}/editar/:id` },
  ]),
  { path: '**', redirectTo: '' },
];
