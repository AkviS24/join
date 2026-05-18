import { Routes } from '@angular/router';
import { Summary } from './pages/summary/summary';
import { AddTask } from './pages/add-task/add-task';
import { Board } from './pages/boards/board/board';
import { Contacts } from './pages/contacts/contacts/contacts';
import { Login } from './components/login/login';
import { Info } from './pages/info/info';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'summary', component: Summary },
  { path: 'add-task', component: AddTask },
  { path: 'board', component: Board },
  { path: 'contacts', component: Contacts },
  { path: 'login', component: Login },
  { path: 'info',redirectTo: 'info/legal',pathMatch: 'full'},
  {path: 'info/:view',component: Info},
];
