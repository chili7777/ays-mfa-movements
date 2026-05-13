import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MovementService } from '../../services/movement.service';
import { AccountService } from '../../services/account.service';
import { CustomerService } from '../../services/customer.service';
import { MfeBridgeService } from '../../../core/services/mfe-bridge.service';
import { Location } from '@angular/common';

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
  private readonly mfeBridge = inject(MfeBridgeService);
  private readonly customerService = inject(CustomerService);
  private readonly location = inject(Location);

  // Signals para el Wizard
  currentStep = signal(1);
  isLoading = signal(false);
  accounts = signal<any[]>([]);

  movementForm: FormGroup;
  isEdit = signal(false);
  movementId = signal<string | null>(null);
  mode = signal<string | null>(null);

  // Búsqueda de cuenta externa
  externalAccount = signal<any | null>(null);
  isSearchingAccount = signal(false);
  accountSearchError = signal<string | null>(null);

  // Datos sincronizados desde el Bridge
  userRole = computed(() => (this.mfeBridge.sessionData().role || 'USER').toUpperCase());
  currentClientId = computed(() => this.mfeBridge.sessionData().clientId);
  isAdmin = computed(() => this.userRole() === 'ADMIN');

  myAccounts = computed(() => {
    const all = this.accounts();
    const myId = this.currentClientId();
    return all.filter(a => a.clientId === myId);
  });

  filteredAccounts = computed(() => {
    const all = this.accounts();
    const mode = this.mode();
    const myId = this.currentClientId();
    const sourceId = this.movementForm.get('sourceAccountId')?.value;

    if (mode === 'external') {
      // Cuentas que NO me pertenecen (Transferencia a Terceros)
      return all.filter(a => a.clientId !== myId);
    } else if (mode === 'internal') {
      // Cuentas que SÍ me pertenecen (Transferencia entre Cuentas) pero no el origen
      return all.filter(a => a.clientId === myId && (a.id || a.accountId) !== sourceId);
    }

    // Si es USER normal y no hay modo (ej. editar), solo sus cuentas
    if (!this.isAdmin() && myId) {
      return all.filter(a => a.clientId === myId);
    }

    return all;
  });

  constructor() {
    this.movementForm = this.fb.group({
      sourceAccountId: [''], // Para transferencias
      accountId: ['', [Validators.required]],
      externalAccountNumber: [''], // Para búsqueda externa
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
      const mode = params.get('mode');
      this.mode.set(mode);

      if (mode) {
        this.movementForm.get('sourceAccountId')?.setValidators([Validators.required]);
        // En transferencias el tipo no es relevante para el usuario
        this.movementForm.get('movementType')?.clearValidators();
      } else {
        this.movementForm.get('sourceAccountId')?.clearValidators();
        this.movementForm.get('movementType')?.setValidators([Validators.required]);
      }
      this.movementForm.get('sourceAccountId')?.updateValueAndValidity();
      this.movementForm.get('movementType')?.updateValueAndValidity();
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

  searchExternalAccount(): void {
    const accountNumber = this.movementForm.get('externalAccountNumber')?.value;
    if (!accountNumber) return;

    this.isSearchingAccount.set(true);
    this.accountSearchError.set(null);
    this.externalAccount.set(null);
    this.movementForm.get('accountId')?.setValue('');

    this.accountService.getAccountByNumber(accountNumber).subscribe({
      next: (account) => {
        if (account) {
          // Si encontramos la cuenta, buscamos el nombre del cliente
          this.customerService.getCustomerById(account.clientId).subscribe({
            next: (customer) => {
              this.isSearchingAccount.set(false);
              this.externalAccount.set({
                ...account,
                clientName: customer?.name || 'Verificado'
              });
              this.movementForm.get('accountId')?.setValue(account.id || account.accountId);
            },
            error: () => {
              // Si falla la búsqueda del cliente, al menos tenemos la cuenta
              this.isSearchingAccount.set(false);
              this.externalAccount.set({
                ...account,
                clientName: 'Verificado'
              });
              this.movementForm.get('accountId')?.setValue(account.id || account.accountId);
            }
          });
        } else {
          this.isSearchingAccount.set(false);
          this.accountSearchError.set('Cuenta no encontrada.');
        }
      },
      error: (err) => {
        this.isSearchingAccount.set(false);
        this.accountSearchError.set('Error al validar la cuenta.');
        console.error('Error searching account', err);
      }
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1) {
      const sourceCtrl = this.movementForm.get('sourceAccountId');
      const accountCtrl = this.movementForm.get('accountId');

      if (sourceCtrl?.invalid) sourceCtrl.markAsTouched();
      if (accountCtrl?.invalid) accountCtrl.markAsTouched();

      if (sourceCtrl?.invalid || accountCtrl?.invalid) return;
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
    const formValue = this.movementForm.value;
    const mode = this.mode();

    if (mode) {
      // Caso Transferencia: Dos movimientos
      const commonData = {
        amount: formValue.amount,
        description: formValue.description || `Transferencia ${mode === 'external' ? 'a terceros' : 'entre cuentas'}`,
        movementDate: new Date().toISOString(),
        status: true
      };

      // 1. Retiro de la cuenta de origen
      const withdrawal = this.movementService.createMovement({
        ...commonData,
        accountId: formValue.sourceAccountId,
        movementType: 'WITHDRAWAL'
      });

      // 2. Depósito en la cuenta de destino
      const deposit = this.movementService.createMovement({
        ...commonData,
        accountId: formValue.accountId,
        movementType: 'DEPOSIT'
      });

      forkJoin([withdrawal, deposit]).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.goBack();
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error en transferencia', err);
          alert('Error al procesar la transferencia. Verifique el saldo de la cuenta de origen.');
        }
      });

    } else {
      // Caso Normal: Un solo movimiento
      const movementData = {
        ...formValue,
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
          alert('Error al procesar la transacción.');
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  get selectedAccount() {
    if (this.mode() === 'external' && this.externalAccount()) {
      return this.externalAccount();
    }
    const id = this.movementForm.get('accountId')?.value;
    return this.accounts().find(a => a.id === id || a.accountId === id);
  }

  get sourceAccount() {
    const id = this.movementForm.get('sourceAccountId')?.value;
    return this.accounts().find(a => a.id === id || a.accountId === id);
  }
}
