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
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./components/storefront/checkout/checkout').then((m) => m.CheckoutComponent),
        title: 'Checkout | MouseTrap',
      },
      {
        path: 'meus-pedidos',
        canActivateChild: [authGuard],
        loadChildren: () => import('./resolvers/pedido.routes').then((m) => m.customerOrderRoutes),
      },
      {
        path: 'lista-de-desejos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./components/storefront/customer-portal/wishlist').then(
            (m) => m.WishlistComponent,
          ),
        title: 'Lista de desejos | MouseTrap',
      },
      {
        path: 'minha-conta',
        canActivate: [authGuard],
        data: { selfService: true },
        loadComponent: () =>
          import('./components/clientes/cliente-form/cliente-form').then(
            (m) => m.ClienteFormComponent,
          ),
        title: 'Minha conta | MouseTrap',
      },
      ...['login', 'cadastro', 'auth/callback', 'acesso-negado'].map((path) => ({
        path,
        data: { mode: path },
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
    ],
  },
  {
    path: 'admin',
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
