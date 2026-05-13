import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MovementService } from '../../services/movement.service';
import { Movement } from '../../interfaces/movement.interface';
import { DateRangePickerComponent } from '../../components/date-range-picker/date-range-picker.component';
import { AccountService } from '../../services/account.service';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../interfaces/customer.interface';
import { MfeBridgeService } from '../../../core/services/mfe-bridge.service';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DateRangePickerComponent],
  templateUrl: './movements-list.component.html',
  styleUrl: './movements-list.component.scss'
})
export class MovementsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly movementService = inject(MovementService);
  private readonly accountService = inject(AccountService);
  private readonly customerService = inject(CustomerService);
  private readonly mfeBridge = inject(MfeBridgeService);

  // Signals para el estado
  movements = signal<Movement[]>([]);
  accounts = signal<any[]>([]);
  customers = signal<Customer[]>([]);
  isLoading = signal(true);

  // Datos sincronizados desde el Bridge
  userRole = computed(() => this.mfeBridge.sessionData().role?.toUpperCase() || null);
  currentClientId = computed(() => this.mfeBridge.sessionData().clientId);

  isAdmin = computed(() => this.userRole() === 'ADMIN' || this.userRole() === 'GESTOR' || this.userRole() === 'ROOT');

  // Filtros
  accountId = signal<string>('');
  selectedClientIdFilter = signal<string>('');
  customerSearchTerm = signal<string>('');
  showCustomerDropdown = signal<boolean>(false);
  movementType = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');

  isFilterVisible = signal(false);
  isDatePickerOpen = signal(false);

  // Movimientos filtrados (cliente-side si es necesario, pero cargamos de API)
  filteredMovements = computed(() => this.movements());

  dropdownCustomers = computed(() => {
    const term = this.customerSearchTerm().toLowerCase().trim();
    if (!term) return this.customers();
    return this.customers().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.identification.toLowerCase().includes(term)
    );
  });

  selectedCustomerName = computed(() => {
    const id = this.selectedClientIdFilter();
    if (!id) return 'Todos los Clientes';
    const customer = this.customers().find(c => c.id === id);
    return customer ? customer.name : 'Cliente Desconocido';
  });

  filteredAccounts = computed(() => {
    const all = this.accounts();

    // Si es USER, solo sus cuentas
    if (!this.isAdmin() && this.currentClientId()) {
      return all.filter(a => a.clientId === this.currentClientId());
    }

    // Si es ADMIN y hay filtro de cliente
    if (this.isAdmin() && this.selectedClientIdFilter()) {
      return all.filter(a => a.clientId === this.selectedClientIdFilter());
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

  private initialLoadDone = false;

  constructor() {
    effect(() => {
      // Recargar datos cuando cambie el rol o el clientId sincronizado
      if (this.userRole() && !this.initialLoadDone) {
        this.initialLoadDone = true;
        if (this.isAdmin()) {
          this.loadCustomers();
        }
        this.loadInitialData();
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const accId = params['accountId'] || params['account'] || params['uuid'];
      const clientId = params['client'] || params['clientId'];

      if (accId) {
        this.accountId.set(accId);
      }
      if (clientId && this.isAdmin()) {
        this.selectedClientIdFilter.set(clientId);
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (data) => this.customers.set(data),
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  loadInitialData(): void {
    const isAdmin = this.isAdmin();
    const clientId = this.currentClientId();

    // Solo cargamos cuentas automáticamente si es USER (son pocas)
    // Para ADMIN, las cargaremos bajo demanda o a partir de los movimientos
    if (!isAdmin && clientId) {
      this.accountService.getAccountsByClientId(clientId).subscribe({
        next: (data) => this.accounts.set(data),
        error: (err) => console.error('Error al cargar cuentas del cliente', err)
      });
    }

    // Cargar movimientos inmediatamente
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
    if (!this.userRole()) return; // Evitar peticiones antes de sincronizar sesión

    this.isLoading.set(true);

    let currentAccountId = this.accountId();
    const isAdmin = this.isAdmin();
    const clientId = this.currentClientId();

    // Seguridad: Si no es ADMIN, validar que la cuenta pertenezca al usuario
    if (!isAdmin && currentAccountId) {
      const allowedAccounts = this.filteredAccounts();
      const isAllowed = allowedAccounts.some(a => (a.id === currentAccountId || a.accountId === currentAccountId));
      // No reseteamos el accountId inmediatamente si allowedAccounts está vacío,
      // porque podría ser que todavía no han cargado las cuentas.
      if (!isAllowed && allowedAccounts.length > 0) {
        console.warn('[Movements List] Intento de acceso a cuenta no autorizada:', currentAccountId);
        currentAccountId = '';
        this.accountId.set('');
      }
    }

    // Seguridad adicional: Si no es ADMIN y NO hay accountId seleccionado,
    // NO cargamos nada por defecto (según requerimiento: solo activarse cuando selecciona una cuenta)
    if (!isAdmin && !currentAccountId) {
      console.log('[Movements List] USER no ha seleccionado cuenta. No se cargan movimientos.');
      this.movements.set([]);
      this.isLoading.set(false);
      return;
    }

    let accountIdsFilter: string | undefined = currentAccountId || undefined;

    const params = {
      accountId: accountIdsFilter,
      fromDate: this.fromDate() || undefined,
      toDate: this.toDate() || undefined,
      movementType: this.movementType() || undefined
    };

    this.movementService.getAllMovements(params).subscribe({
      next: (data) => {
        this.movements.set(data);
        this.isLoading.set(false);
        // Optimización: Cargar labels de cuentas que vienen en el listado
        if (this.isAdmin()) {
          this.loadMissingAccountLabels(data);
        }
      },
      error: (err) => {
        console.error('Error al cargar movimientos', err);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Carga la información de las cuentas que aparecen en los movimientos
   * para poder mostrar sus labels (número, tipo) sin cargar todas las cuentas.
   */
  private loadMissingAccountLabels(movements: Movement[]): void {
    const uniqueAccountIds = [...new Set(movements.map(m => m.accountId))];
    const currentAccountIds = this.accounts().map(a => a.id || a.accountId);

    uniqueAccountIds.forEach(id => {
      if (!currentAccountIds.includes(id)) {
        this.accountService.getAccountById(id).subscribe({
          next: (acc) => {
            if (acc) {
              this.accounts.update(prev => {
                const alreadyExists = prev.some(a => (a.id === id || a.accountId === id));
                return alreadyExists ? prev : [...prev, acc];
              });
            }
          }
        });
      }
    });
  }

  /**
   * Permite cargar todas las cuentas (útil para el ADMIN cuando quiere filtrar)
   */
  loadAllAccounts(): void {
    this.accountService.getAccounts().subscribe({
      next: (data) => this.accounts.set(data),
      error: (err) => console.error('Error al cargar todas las cuentas', err)
    });
  }

  clearFilters(): void {
    this.accountId.set('');
    this.selectedClientIdFilter.set('');
    this.movementType.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.loadMovements();
  }

  toggleCustomerDropdown(): void {
    if (!this.isAdmin()) return;
    this.showCustomerDropdown.update(v => !v);
    if (this.showCustomerDropdown()) {
      this.customerSearchTerm.set('');
    }
  }

  selectCustomerFilter(customer: Customer): void {
    const clientId = customer.id || '';
    this.selectedClientIdFilter.set(clientId);
    this.showCustomerDropdown.set(false);
    this.accountId.set(''); // Reset account when client changes

    // Optimización: Cargar solo las cuentas de este cliente
    if (clientId) {
      this.accountService.getAccountsByClientId(clientId).subscribe({
        next: (accs) => this.accounts.set(accs),
        error: (err) => console.error('Error al cargar cuentas del cliente seleccionado', err)
      });
    }

    this.loadMovements();
  }

  clearCustomerFilter(): void {
    this.selectedClientIdFilter.set('');
    this.showCustomerDropdown.set(false);
    this.accountId.set('');
    // Al limpiar filtro de cliente, reseteamos la lista de cuentas (se repoblará desde movimientos o manual)
    this.accounts.set([]);
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
