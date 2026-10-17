import { MatPaginatorIntl } from '@angular/material/paginator';

export function paginacaoPortugues(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Itens por página:';
  intl.nextPageLabel = 'Próxima página';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primeira página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page, pageSize, length) => {
    if (!length || !pageSize) return `0 de ${length}`;
    const inicio = page * pageSize;
    return `${inicio + 1}–${Math.min(inicio + pageSize, length)} de ${length}`;
  };
  return intl;
}
