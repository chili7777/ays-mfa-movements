import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementService } from '../../services/movement.service';
import { AccountService } from '../../services/account.service';
import { Movement } from '../../interfaces/movement.interface';

@Component({
  selector: 'app-movement-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movement-detail.component.html'
})
export class MovementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movementService = inject(MovementService);
  private readonly accountService = inject(AccountService);

  movement = signal<Movement | null>(null);
  account = signal<any | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMovement(id);
    } else {
      this.errorMessage.set('No se proporcionó un ID de movimiento válido');
      this.loading.set(false);
    }
  }

  loadMovement(id: string): void {
    this.loading.set(true);
    this.movementService.getMovementById(id).subscribe({
      next: (data) => {
        this.movement.set(data);
        this.loadAccount(data.accountId);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar la información del movimiento.');
        this.loading.set(false);
      }
    });
  }

  loadAccount(accountId: string): void {
    this.accountService.getAccountById(accountId).subscribe({
      next: (data) => {
        this.account.set(data);
        this.loading.set(false);
      },
      error: () => {
        // No es crítico si no carga el detalle de la cuenta
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/movements']);
  }

  getTypeLabel(type: string | undefined): string {
    return type === 'DEPOSIT' ? 'Depósito' : 'Retiro';
  }
}
