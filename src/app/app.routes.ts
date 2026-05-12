import { Routes } from '@angular/router';
import { MovementsListComponent } from './movements/pages/movements-list/movements-list.component';
import { MovementFormComponent } from './movements/pages/movement-form/movement-form.component';
import { MovementDetailComponent } from './movements/pages/movement-detail/movement-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'movements', pathMatch: 'full' },
  { path: 'movements', component: MovementsListComponent },
  { path: 'movements/create', component: MovementFormComponent },
  { path: 'movements/detail/:id', component: MovementDetailComponent },
  { path: '**', redirectTo: 'movements' }
];
