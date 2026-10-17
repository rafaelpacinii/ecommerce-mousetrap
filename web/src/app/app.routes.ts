import { authGuard, adminGuard } from './guards/auth.guard';
import { Routes } from '@angular/router';
import { marcaResolver } from './resolvers/marca.resolver';
import { mouseResolver } from './resolvers/mouse.resolver';

import { produtoResolver } from './resolvers/produto.resolver';
import { clienteResolver } from './resolvers/cliente.resolver';

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
        data: { checkoutMode: true },
        loadComponent: () =>
          import('./components/storefront/cart/cart').then((m) => m.CartComponent),
        title: 'Checkout | MouseTrap',
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
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'mouses' },
      {
        path: 'marcas',
        loadComponent: () =>
          import('./components/marcas/marca-list/marca-list').then((m) => m.MarcaListComponent),
        title: 'Marcas | MouseTrap',
      },
      {
        path: 'marcas/novo',
        loadComponent: () =>
          import('./components/marcas/marca-form/marca-form').then((m) => m.MarcaFormComponent),
        title: 'Cadastrar marca | MouseTrap',
      },
      {
        path: 'marcas/editar/:id',
        loadComponent: () =>
          import('./components/marcas/marca-form/marca-form').then((m) => m.MarcaFormComponent),
        resolve: { marca: marcaResolver },
        title: 'Editar marca | MouseTrap',
      },
      {
        path: 'mouses',
        loadComponent: () =>
          import('./components/mouses/mouse-list/mouse-list').then((m) => m.MouseListComponent),
        title: 'Mouses | MouseTrap',
      },
      {
        path: 'mouses/novo',
        loadComponent: () =>
          import('./components/mouses/mouse-form/mouse-form').then((m) => m.MouseFormComponent),
        title: 'Cadastrar mouse | MouseTrap',
      },
      {
        path: 'mouses/editar/:id',
        loadComponent: () =>
          import('./components/mouses/mouse-form/mouse-form').then((m) => m.MouseFormComponent),
        resolve: { mouse: mouseResolver },
        title: 'Editar mouse | MouseTrap',
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./components/clientes/cliente-list/cliente-list').then(
            (m) => m.ClienteListComponent,
          ),
        title: 'Clientes | MouseTrap',
      },
      {
        path: 'clientes/novo',
        loadComponent: () =>
          import('./components/clientes/cliente-form/cliente-form').then(
            (m) => m.ClienteFormComponent,
          ),
        title: 'Cadastrar cliente | MouseTrap',
      },
      {
        path: 'clientes/editar/:id',
        loadComponent: () =>
          import('./components/clientes/cliente-form/cliente-form').then(
            (m) => m.ClienteFormComponent,
          ),
        resolve: { cliente: clienteResolver },
        title: 'Editar cliente | MouseTrap',
      },
    ],
  },
  ...['mouses', 'marcas', 'clientes'].flatMap((resource) => [
    { path: resource, pathMatch: 'full' as const, redirectTo: `admin/${resource}` },
    { path: `${resource}/novo`, redirectTo: `admin/${resource}/novo` },
    { path: `${resource}/editar/:id`, redirectTo: `admin/${resource}/editar/:id` },
  ]),
  { path: '**', redirectTo: '' },
];
