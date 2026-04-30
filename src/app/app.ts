import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('join');

  demoDB = inject(Supabase);
  contacts = inject(Database);

  ngOnInit() {
    this.demoDB.getDemoData();
  }

  // Supabase Funktionen nur zu Demozwecken und implementierung in andere Komponenten

  addDemoData(demoData: {name: string, email: string, phone: number, password: string}) {
    this.demoDB.setDemoData(demoData);
  }

  // // Database Funktion um einen neuen Kontakt anzulegen, wird in AddTask Komponente implementiert 
  // addData(demoData: { name: string, email: string, password: string, phone: number}) {
  //   this.contacts.setData(demoData);
  // }

  updateDemoData(id: number, name: string, email: string, phone: number, password: string) {
    this.demoDB.getupdateDemoData(id, name, email, phone, password);
  }

  // // Database Funktion um einen Kontakt zu updaten, wird in Board Komponente implementiert
  // updateData(userId: number, name: string, email: string, password: string, phone: number) {
  //   this.contacts.UpdateDatas(userId, name, email, password, phone);
  // }

  // Database Funktion um einen Kontakt zu löschen, wird in Board Komponente implementiert
  deleteContact(id: number) {
    this.demoDB.deleteData(id);
  }
}