import { Component, inject } from '@angular/core';
import { NameColor } from '../../services/name-color';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-contact-test',
  imports: [],
  templateUrl: './contact-test.html',
  styleUrl: './contact-test.scss',
})

export class ContactTest {
  demoDB = inject(Supabase);
  nameColorService = inject(NameColor);

  showDetails(user: { id: number; created_at: string; firstname: string; name: string; email: string; phone: number; }){
    
  }
}
