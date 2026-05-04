import { Injectable, signal } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://ihqvvagcuemrsbalsksp.supabase.co';
  supabaseKey = 'sb_publishable_N4wmb3jqA8vxuofrj9kFPg_45-BAgZo';
  supabase = createClient(this.supabaseUrl, this.supabaseKey);
  channels: RealtimeChannel | undefined;

  demoDaten = signal<{ id: number, created_at: string, name: string, email: string, phone: number, loggedIn: boolean, password: string }[]>([]);

  async getDemoData() {

    let { data: demoDB, error } = await this.supabase
      .from('demoDB')
      .select('*')
      .order('name', { ascending: true });
    if (!demoDB) return
    this.demoDaten.set(demoDB)

    this.channels = this.supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        (payload) => {
          console.log('Change received!', payload)
        }
      )
      .subscribe()
  }

  ngOnDestroy() {
    this.supabase.removeChannel(this.channels!);
  }

  async setDemoData(demoData: { name: string, email: string, phone: number, password: string }) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .insert([demoData])
      .select()
  }

  async getupdateDemoData(id: number, name: string, email: string, phone: number, password: string) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .update({ name, email, phone, password })
      .eq('id', id)
      .select()
  }

  async deleteData(id: number) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .delete()
      .select()
      .eq('id', id)
  }
}
