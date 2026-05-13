import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MovementService } from '../../services/movement.service';
import { Movement } from '../../interfaces/movement.interface';
import { DateRangePickerComponent } from '../../components/date-range-picker/date-range-picker.component';
import { AccountService } from '../../services/account.service';
import { MfeBridgeService } from '../../../core/services/mfe-bridge.service';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DateRangePickerComponent],
  templateUrl: './movements-list.component.html'
})
export class MovementsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly movementService = inject(MovementService);
  private readonly accountService = inject(AccountService);
  private readonly mfeBridge = inject(MfeBridgeService);

  // Signals para el estado
  movements = signal<Movement[]>([]);
  accounts = signal<any[]>([]);
  isLoading = signal(true);

  // Datos sincronizados desde el Bridge
  userRole = computed(() => (this.mfeBridge.sessionData().role || 'USER').toUpperCase());
  currentClientId = computed(() => this.mfeBridge.sessionData().clientId);

  isAdmin = computed(() => this.userRole() === 'ADMIN');

  // Filtros
  accountId = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');

  isFilterVisible = signal(false);
  isDatePickerOpen = signal(false);

  // Movimientos filtrados (cliente-side si es necesario, pero cargamos de API)
  filteredMovements = computed(() => this.movements());

  filteredAccounts = computed(() => {
    const all = this.accounts();
    if (!this.isAdmin() && this.currentClientId()) {
      return all.filter(a => a.clientId === this.currentClientId());
    }
    return all;
  });

  groupedMovements = computed(() => {
    const groups: { date: string, items: Movement[] }[] = [];
    // Ordenar por fecha descendente primero para asegurar el orden de los grupos
    const sorted = [...this.filteredMovements()].sort((a, b) =>
      new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
    );

    sorted.forEach(m => {
      const dateKey = m.movementDate.split('T')[0];
      let group = groups.find(g => g.date === dateKey);
      if (!group) {
        group = { date: dateKey, items: [] };
        groups.push(group);
      }
      group.items.push(m);
    });
    return groups;
  });

  dateRangeLabel = computed(() => {
    if (!this.fromDate() && !this.toDate()) return 'Todas las fechas';

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

    if (this.fromDate() && !this.toDate()) {
      return `Desde ${this.formatDateLabel(this.fromDate())}`;
    }
    if (!this.fromDate() && this.toDate()) {
      return `Hasta ${this.formatDateLabel(this.toDate())}`;
    }
    return `${this.formatDateLabel(this.fromDate())} - ${this.formatDateLabel(this.toDate())}`;
  });

  private formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
  }

  constructor() {
    effect(() => {
      // Recargar datos cuando cambie el rol o el clientId sincronizado
      if (this.userRole()) {
        this.loadInitialData();
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const accId = params['accountId'] || params['account'];
      if (accId) {
        this.accountId.set(accId);
      }
      this.loadInitialData();
    });
  }

  loadInitialData(): void {
    const clientId = this.currentClientId();
    const obs$ = (clientId)
      ? this.accountService.getAccountsByClientId(clientId)
      : this.accountService.getAccounts();

    obs$.subscribe({
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

  goToExternalTransfer(): void {
    this.router.navigate(['/movements/create'], { queryParams: { mode: 'external' } });
  }

  goToInternalTransfer(): void {
    this.router.navigate(['/movements/create'], { queryParams: { mode: 'internal' } });
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

  getGroupLabel(dateKey: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groupDate = new Date(dateKey + 'T00:00:00');

    if (groupDate.getTime() === today.getTime()) return 'Hoy';
    if (groupDate.getTime() === yesterday.getTime()) return 'Ayer';
    return '';
  }
}
