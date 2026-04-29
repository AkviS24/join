import { Routes } from '@angular/router';
import { Summary } from './components/summary/summary';
import { AddTask } from './components/add-task/add-task';
import { Board } from './components/board/board';
import { Contacts } from './components/contacts/contacts';

export const routes: Routes = [
  { path: '', redirectTo: 'summary', pathMatch: 'full' },

  { path: 'summary', component: Summary },
  { path: 'add-task', component: AddTask },
  { path: 'board', component: Board },
  { path: 'contacts', component: Contacts },
];