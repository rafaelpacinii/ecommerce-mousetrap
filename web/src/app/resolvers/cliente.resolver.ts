import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Cliente } from '../models/cliente.model';
import { ClienteService } from '../services/cliente.service';
export const clienteResolver: ResolveFn<Cliente> = (route) =>
  inject(ClienteService).findById(Number(route.paramMap.get('id')));
