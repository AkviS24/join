import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './supabase';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe, FormsModule],
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

  updateDemoData(userId: number, demoData: { firstname: string, name: string, email: string, phone: number }) {
    this.demoDB.getupdateDemoData(userId,  demoData);
  }
}
