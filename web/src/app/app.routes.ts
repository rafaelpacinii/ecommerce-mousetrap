import { Routes } from '@angular/router';
import { marcaResolver } from './resolvers/marca.resolver';
import { mouseResolver } from './resolvers/mouse.resolver';

import { clienteResolver } from './resolvers/cliente.resolver';

export const routes: Routes = [
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
      import('./components/clientes/cliente-list/cliente-list').then((m) => m.ClienteListComponent),
    title: 'Clientes | MouseTrap',
  },
  {
    path: 'clientes/novo',
    loadComponent: () =>
      import('./components/clientes/cliente-form/cliente-form').then((m) => m.ClienteFormComponent),
    title: 'Cadastrar cliente | MouseTrap',
  },
  {
    path: 'clientes/editar/:id',
    loadComponent: () =>
      import('./components/clientes/cliente-form/cliente-form').then((m) => m.ClienteFormComponent),
    resolve: { cliente: clienteResolver },
    title: 'Editar cliente | MouseTrap',
  },
  { path: '', redirectTo: 'marcas', pathMatch: 'full' },
  { path: '**', redirectTo: 'marcas' },
];
