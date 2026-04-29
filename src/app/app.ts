import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contacts } from "./components/contacts/contacts";
import { Header } from './components/header/header';
import { Navigation } from './components/navigation/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe, FormsModule, Header, Navigation],
  imports: [RouterOutlet, JsonPipe, FormsModule, Contacts, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('join');

  demoDB = inject(Supabase);

  ngOnInit() {
    this.demoDB.getDemoData();
  }

  addDemoData(demoData: { firstname: string, name: string, email: string, phone: number }) {
    this.demoDB.setDemoData(demoData);
  }

  updateDemoData(userId: number, firstname: string, name: string, email: string, phone: number) {
    this.demoDB.getupdateDemoData(userId, firstname, name, email, phone);
  }
}
