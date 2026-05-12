import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovementService } from '../../services/movement.service';
import { Movement } from '../../interfaces/movement.interface';
import { DateRangePickerComponent } from '../../components/date-range-picker/date-range-picker.component';

@Component({
  selector: 'app-movements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangePickerComponent],
  templateUrl: './movements-list.component.html'
})
export class MovementsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly movementService = inject(MovementService);

  movements: Movement[] = [];
  filteredMovements: Movement[] = [];

  // Filtros
  accountId: string = '';
  fromDate: string = '';
  toDate: string = '';
  isFilterVisible: boolean = false;
  isDatePickerOpen: boolean = false;

  ngOnInit(): void {
    this.loadMovements();
  }

  toggleFilters(): void {
    this.isFilterVisible = !this.isFilterVisible;
  }

  openDatePicker(): void {
    this.isDatePickerOpen = true;
  }

  onDateRangeSelected(range: { fromDate: string; toDate: string }): void {
    this.fromDate = range.fromDate;
    this.toDate = range.toDate;
    this.loadMovements();
  }

  loadMovements(): void {
    const params = {
      accountId: this.accountId || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined
    };

    this.movementService.getAllMovements(params).subscribe({
      next: (data) => {
        this.movements = data;
        this.filteredMovements = data;
      },
      error: (err) => console.error('Error al cargar movimientos', err)
    });
  }

  onFilter(): void {
    this.loadMovements();
  }

  clearFilters(): void {
    this.accountId = '';
    this.fromDate = '';
    this.toDate = '';
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
}
