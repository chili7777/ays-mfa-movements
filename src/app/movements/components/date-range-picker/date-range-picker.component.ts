import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MonthData {
  label: string;
  days: Date[];
  padding: number[];
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss'
})
export class DateRangePickerComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() initialFromDate = '';
  @Input() initialToDate = '';
  @Output() close = new EventEmitter<void>();
  @Output() selectRange = new EventEmitter<{ fromDate: string; toDate: string }>();

  months: MonthData[] = [];
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  tempFromDate: string = '';
  tempToDate: string = '';
  selecting: 'from' | 'to' = 'from';

  ngOnInit(): void {
    this.generateMonths();
    this.resetTemps();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.resetTemps();
    }
  }

  private resetTemps(): void {
    this.tempFromDate = this.initialFromDate;
    this.tempToDate = this.initialToDate;
    this.selecting = this.tempFromDate ? 'to' : 'from';
  }

  private generateMonths(): void {
    const today = new Date();
    // Generar mes actual y los dos anteriores
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      this.months.push(this.getMonthData(date));
    }
  }

  private getMonthData(date: Date): MonthData {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
    const days: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      days,
      padding: Array(firstDay).fill(0)
    };
  }

  onDateClick(date: Date): void {
    const formatted = this.formatDate(date);

    if (this.selecting === 'from') {
      this.tempFromDate = formatted;
      this.tempToDate = '';
      this.selecting = 'to';
    } else {
      if (new Date(formatted) < new Date(this.tempFromDate)) {
        this.tempFromDate = formatted;
        this.tempToDate = '';
      } else {
        this.tempToDate = formatted;
        this.selecting = 'from';
      }
    }
  }

  isSelected(date: Date): boolean {
    const formatted = this.formatDate(date);
    return formatted === this.tempFromDate || formatted === this.tempToDate;
  }

  isInRange(date: Date): boolean {
    if (!this.tempFromDate || !this.tempToDate) return false;
    const d = this.formatDate(date);
    return d > this.tempFromDate && d < this.tempToDate;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onClose(): void {
    this.close.emit();
  }

  applySelection(): void {
    this.selectRange.emit({ fromDate: this.tempFromDate, toDate: this.tempToDate });
    this.onClose();
  }

  clearSelection(): void {
    this.tempFromDate = '';
    this.tempToDate = '';
    this.selecting = 'from';
  }
}
