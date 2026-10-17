import { Component, inject, Injectable } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
interface Confirmacao {
  titulo: string;
  mensagem: string;
  confirmar: string;
}
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: ` <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>{{ data.mensagem }}</mat-dialog-content>
    <mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false" cdkFocusInitial>Voltar</button>
      <button mat-flat-button [mat-dialog-close]="true">
        {{ data.confirmar }}
      </button></mat-dialog-actions
    >`,
  styles: `
    mat-dialog-content {
      max-width: 480px;
      line-height: 1.7;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<Confirmacao>(MAT_DIALOG_DATA);
}
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  private readonly dialog = inject(MatDialog);
  abrir(titulo: string, mensagem: string, confirmar = 'Confirmar') {
    return this.dialog
      .open(ConfirmDialogComponent, {
        data: { titulo, mensagem, confirmar },
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        restoreFocus: true,
        autoFocus: 'first-tabbable',
        ariaLabel: titulo,
      })
      .afterClosed();
  }
}
