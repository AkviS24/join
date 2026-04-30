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
    this.contacts.getData();
  }

  addDemoData(demoData: { firstname: string, name: string, email: string, phone: number }) {
    this.demoDB.setDemoData(demoData);
  }

  addData(demoData: { name: string, email: string, password: string, phone: number}) {
    this.contacts.setData(demoData);
  }

  updateDemoData(userId: number, firstname: string, name: string, email: string, phone: number) {
    this.demoDB.getupdateDemoData(userId, firstname, name, email, phone);
  }

  updateData(userId: number, name: string, email: string, password: string, phone: number) {
    this.contacts.UpdateDatas(userId, name, email, password, phone);
  }

  deleteContact(id: number) {
    this.contacts.deleteData(id);
  }
}