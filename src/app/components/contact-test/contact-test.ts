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
  ngOnInit() {
    const kuerzel = this.nameColorService.getInitials('Mustermann', 'Max');
    console.log('Mein Kürzel Test:', kuerzel);
  }
}
