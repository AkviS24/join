import { Routes } from '@angular/router';
import { Summary } from './pages/summary/summary';
import { AddTask } from './pages/add-task/add-task';
import { Board } from './pages/board/board';
import { Contacts } from './pages/contacts/contacts/contacts';
import { Login } from './components/login/login';
import { PrivacyPolice } from './pages/privacy-policy/privacyPolicy';
import { LegalNotice } from './pages/legal-notice/legalNotice';
import { Discription } from './components/discription/discription';

export const routes: Routes = [
  { path: '', redirectTo: 'contacts', pathMatch: 'full' },

  { path: 'summary', component: Summary },
  { path: 'add-task', component: AddTask },
  { path: 'board', component: Board },
  { path: 'contacts', component: Contacts },
  { path: 'login', component: Login },
  { path: 'privacy-police', component: PrivacyPolice },
  { path: 'legal-notice', component: LegalNotice },
  { path: 'help', component: Discription },
];
