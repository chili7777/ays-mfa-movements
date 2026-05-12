import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovementService } from '../../services/movement.service';
import { Movement } from '../../interfaces/movement.interface';
import { DateRangePickerComponent } from '../../components/date-range-picker/date-range-picker.component';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangePickerComponent],
  templateUrl: './movements-list.component.html'
})
export class MovementsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly movementService = inject(MovementService);
  private readonly accountService = inject(AccountService);

  // Signals para el estado
  movements = signal<Movement[]>([]);
  accounts = signal<any[]>([]);
  isLoading = signal(true);

  // Filtros
  accountId = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');

  isFilterVisible = signal(false);
  isDatePickerOpen = signal(false);

  // Movimientos filtrados (cliente-side si es necesario, pero cargamos de API)
  filteredMovements = computed(() => this.movements());

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.accountService.getAccounts().subscribe({
      next: (data) => this.accounts.set(data),
      error: (err) => console.error('Error al cargar cuentas', err)
    });
    this.loadMovements();
  }

  toggleFilters(): void {
    this.isFilterVisible.update(v => !v);
  }

  onDateRangeSelected(range: { fromDate: string; toDate: string }): void {
    this.fromDate.set(range.fromDate);
    this.toDate.set(range.toDate);
    this.loadMovements();
  }

  loadMovements(): void {
    this.isLoading.set(true);
    const params = {
      accountId: this.accountId() || undefined,
      fromDate: this.fromDate() || undefined,
      toDate: this.toDate() || undefined
    };

    this.movementService.getAllMovements(params).subscribe({
      next: (data) => {
        this.movements.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar movimientos', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.accountId.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.loadMovements();
  }

  goToCreate(): void {
    this.router.navigate(['/movements/create']);
  }

  goToDetail(id: string): void {
    this.router.navigate(['/movements/detail', id]);
  }

  getTypeLabel(type: string): string {
    return type === 'DEPOSIT' ? 'Depósito' : 'Retiro';
  }

  getAccountLabel(accId: string): string {
    const acc = this.accounts().find(a => a.id === accId || a.accountId === accId);
    return acc ? `${acc.accountNumber} - ${acc.accountType}` : accId;
  }
}
