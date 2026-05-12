import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementService } from '../../services/movement.service';

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movement-form.component.html'
})
export class MovementFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly movementService = inject(MovementService);

  movementForm: FormGroup;

  constructor() {
    this.movementForm = this.fb.group({
      accountId: ['', [Validators.required]],
      movementType: ['DEPOSIT', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.movementForm.invalid) return;

    const formValue = this.movementForm.value;
    const movementData = {
      ...formValue,
      movementDate: new Date().toISOString()
    };

    this.movementService.createMovement(movementData).subscribe({
      next: () => {
        alert('Movimiento realizado con éxito');
        this.goBack();
      },
      error: (err) => {
        console.error('Error al crear movimiento', err);
        alert('Error al realizar el movimiento. Verifique el saldo y los datos de la cuenta.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/movements']);
  }
}
