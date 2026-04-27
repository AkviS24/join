import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './supabase';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('join');

  demoDB = inject(Supabase);
}
