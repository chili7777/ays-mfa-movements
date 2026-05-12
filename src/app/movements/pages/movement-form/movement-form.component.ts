import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementService } from '../../services/movement.service';
import { AccountService } from '../../services/account.service';

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
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);

  // Signals para el Wizard
  currentStep = signal(1);
  isLoading = signal(false);
  accounts = signal<any[]>([]);

  movementForm: FormGroup;
  isEdit = signal(false);
  movementId = signal<string | null>(null);
  mode = signal<string | null>(null);

  constructor() {
    this.movementForm = this.fb.group({
      accountId: ['', [Validators.required]],
      movementType: ['DEPOSIT', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.maxLength(100)]],
      status: [true]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();

    // Leer modo de los query params
    this.route.queryParamMap.subscribe(params => {
      this.mode.set(params.get('mode'));
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.movementId.set(id);
      this.loadMovement(id);
    }
  }

  loadAccounts(): void {
    this.accountService.getAccounts().subscribe({
      next: (data) => this.accounts.set(data),
      error: (err) => console.error('Error al cargar cuentas', err)
    });
  }

  loadMovement(id: string): void {
    this.isLoading.set(true);
    this.movementService.getMovementById(id).subscribe({
      next: (movement) => {
        this.movementForm.patchValue(movement);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar movimiento', err);
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1 && this.movementForm.get('accountId')?.invalid) {
      this.movementForm.get('accountId')?.markAsTouched();
      return;
    }
    if (this.currentStep() === 2 && (this.movementForm.get('movementType')?.invalid || this.movementForm.get('amount')?.invalid)) {
      this.movementForm.get('movementType')?.markAsTouched();
      this.movementForm.get('amount')?.markAsTouched();
      return;
    }
    this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    this.currentStep.update(s => s - 1);
  }

  onSubmit(): void {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const movementData = {
      ...this.movementForm.value,
      movementDate: new Date().toISOString()
    };

    const request = this.isEdit()
      ? this.movementService.updateMovement(movementData, this.movementId()!)
      : this.movementService.createMovement(movementData);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.goBack();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error al procesar movimiento', err);
        alert('Error al procesar la transacción. Verifique el saldo y los datos.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/movements']);
  }

  get selectedAccount() {
    const id = this.movementForm.get('accountId')?.value;
    return this.accounts().find(a => a.id === id || a.accountId === id);
  }
}
