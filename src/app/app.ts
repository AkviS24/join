import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Supabase } from './services/supabase';
import { FormsModule } from '@angular/forms';
import { Header } from './components/header/header';
import { Navigation } from './components/navigation/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, Header, Navigation],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  [x: string]: any;
  protected readonly title = signal('join');

  demoDB = inject(Supabase);
  router = inject(Router);

  hideMenuAndHeader = false;

  ngOnInit() {
    this.demoDB.getDemoData();

    
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.hideMenuAndHeader = event.urlAfterRedirects.includes('/login');
      });
  }

  addDemoData(demoData: { name: string; email: string; phone: number, password: string }) {
    this.demoDB.setDemoData(demoData);
  }

  updateDemoData(id: number, name: string, email: string, phone: number, password: string) {
    this.demoDB.getupdateDemoData(id, name, email, phone, password);
  }

  
  deleteContact(id: number) {
    this.demoDB.deleteData(id);
  }
}
