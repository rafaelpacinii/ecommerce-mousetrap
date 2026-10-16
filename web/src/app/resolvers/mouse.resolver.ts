import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { Mouse } from '../models/mouse.model';
import { MouseService } from '../services/mouse.service';
import { mensagemErro } from '../services/erro-api';

export const mouseResolver: ResolveFn<Mouse> = (route) => {
  const service = inject(MouseService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);
  const id = Number(route.paramMap.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    snack.open('Identificador inválido.', 'Fechar', { duration: 5000 });
    return new RedirectCommand(router.parseUrl('/mouses'));
  }
  return service.findById(id).pipe(
    catchError((erro: unknown) => {
      snack.open(mensagemErro(erro), 'Fechar', { duration: 6000 });
      return of(new RedirectCommand(router.parseUrl('/mouses')));
    }),
  );
};
