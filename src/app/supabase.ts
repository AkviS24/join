import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://ihqvvagcuemrsbalsksp.supabase.co';
  supabaseKey = 'sb_publishable_N4wmb3jqA8vxuofrj9kFPg_45-BAgZo';
  supabase = createClient(this.supabaseUrl, this.supabaseKey);

  demoDaten = signal<{ id: number, created_at: string, firstname: string, name: string, email: string, phone: number }[]>([]);

  async getDemoData() {

    let { data: demoDB, error } = await this.supabase
      .from('demoDB')
      .select('*')
    if (!demoDB) return
    this.demoDaten.set(demoDB)

  }

  async setDemoData(demoData: { firstname: string, name: string, email: string, phone: number }) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .insert([demoData])
      .select()
  }

  async getupdateDemoData(id: number, demoData: { firstname: string, name: string, email: string, phone: number }) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .update([demoData])
      .eq('id', id)
      .select()
  }
}
