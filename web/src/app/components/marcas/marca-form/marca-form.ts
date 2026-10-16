import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Marca } from '../../../models/marca.model';
import { MarcaService } from '../../../services/marca.service';
import { mensagemErro, textoObrigatorio } from '../../../services/erro-api';

@Component({
  selector: 'app-marca-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './marca-form.html',
  styleUrl: './marca-form.css',
})
export class MarcaFormComponent {
  private readonly service = inject(MarcaService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly marca: Marca | undefined = inject(ActivatedRoute).snapshot.data['marca'];
  readonly salvando = signal(false);
  readonly form = this.fb.nonNullable.group({
    nome: [
      '',
      [Validators.required, textoObrigatorio, Validators.minLength(2), Validators.maxLength(100)],
    ],
    ativo: [true, Validators.required],
  });

  constructor() {
    if (this.marca) this.form.patchValue(this.marca);
  }

  salvar(): void {
    if (this.salvando()) return;
    this.form.controls.nome.setValue(this.form.controls.nome.value.trim());
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dados = this.form.getRawValue();
    const requisicao =
      this.marca?.id != null
        ? this.service.update(this.marca.id, dados)
        : this.service.create(dados);
    this.salvando.set(true);
    this.form.disable({ emitEvent: false });
    requisicao
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.salvando.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.snack.open('Marca salva com sucesso.', 'Fechar', { duration: 4000 });
          void this.router.navigate(['/marcas']);
        },
        error: (erro: unknown) => this.snack.open(mensagemErro(erro), 'Fechar', { duration: 7000 }),
      });
  }
}
