import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Supabase } from './services/supabase';
import { Database } from './services/database';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from './components/header/header';
import { Navigation } from './components/navigation/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe, FormsModule, Header, Navigation],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  [x: string]: any;
  protected readonly title = signal('join');

  demoDB = inject(Supabase);
  contacts = inject(Database);
  router = inject(Router);

  hideMenuAndHeader = false;

  ngOnInit() {
    this.demoDB.getDemoData();
    this.contacts.getData();

    
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.hideMenuAndHeader = event.urlAfterRedirects.includes('/login');
      });
  }

  addDemoData(demoData: { name: string; email: string; phone: number }) {
    this.demoDB.setDemoData(demoData);
  }

  // Database Funktion um einen neuen Kontakt anzulegen, wird in AddTask Komponente implementiert
  addData(demoData: { name: string; email: string; password: string; phone: number }) {
    this.contacts.setData(demoData);
  }

  updateDemoData(userId: number, name: string, email: string, phone: number) {
    this.demoDB.getupdateDemoData(userId, name, email, phone);
  }

  
  updateData(userId: number, name: string, email: string, password: string, phone: number) {
    this.contacts.UpdateDatas(userId, name, email, password, phone);
  }

  
  deleteContact(id: number) {
    this.demoDB.deleteData(id);
  }
}
