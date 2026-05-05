import { Routes } from '@angular/router';
import { Summary } from './components/summary/summary';
import { AddTask } from './components/add-task/add-task';
import { Board } from './components/board/board';
import { Contacts } from './components/contacts/contacts';
import { Login } from './components/login/login';
import { PrivacyPolice } from './components/privacy-police/privacyPolice';
import { LegalNotice } from './components/legal-notice/legalNotice';
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
