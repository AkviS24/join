import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './supabase';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('join');

  demoDB = inject(Supabase);

  ngOnInit() {
    this.demoDB.getDemoData();
  }

  addDemoData() {
    this.demoDB.setDemoData({firstname:"Karl", name:"Arsch", email:"arsch@hotmail.com", phone:1746688412})
  }
}
