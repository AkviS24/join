import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Database {
  supabaseUrl = 'https://ihqvvagcuemrsbalsksp.supabase.co';
  supabaseKey = 'sb_publishable_N4wmb3jqA8vxuofrj9kFPg_45-BAgZo';
  supabase = createClient(this.supabaseUrl, this.supabaseKey);

  demoDaten = signal<{ id: number, created_at: string, name: string, email: string, password: string, phone: number, isLoggedIn: boolean }[]>([]);

  async getDemoData() {

    let { data: contacts, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('firstname', { ascending: true });
    if (!contacts) return
    this.demoDaten.set(contacts)

  }

  async setDemoData(demoData: { name: string, email: string, password: string, phone: number }) {
    const { data, error } = await this.supabase
      .from('contacts')
      .insert([demoData])
      .select()
  }

  async getupdateDemoData(id: number, name: string, email: string, password: string, phone: number) {
    const { data, error } = await this.supabase
      .from('contacts')
      .update({ name, email, password, phone })
      .eq('id', id)
      .select()
  }
}
