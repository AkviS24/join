import { Injectable, signal } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = environment.supabaseUrl;
  supabaseKey = environment.supabaseKey;
  supabase = createClient(this.supabaseUrl, this.supabaseKey);
  channels: RealtimeChannel | undefined;

  demoDaten = signal<{ id: number, created_at: string, name: string, email: string, phone: number, loggedIn: boolean, password: string }[]>([]);
  selectedUser = signal<any | null>(null);

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
        { event: '*', schema: 'public', table: 'demoDB' },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            // this.demoDaten.update((current) => [...current, payload.new as any]);
            this.demoDaten.update((current) => {
              const exists = current.some(item => item.id === payload.new['id']);
              if (exists) {
                return current;
              }
              return [...current, payload.new as any];
            });
          } else if (payload.eventType === 'UPDATE') {
            this.demoDaten.update((current) =>
              current.map((item) => (item.id === payload.new['id'] ? (payload.new as any) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            this.demoDaten.update((current) =>
              current.filter((item) => item.id !== payload.old['id'])
            );
          }
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
      .select();
    if (data && data.length > 0) {
      this.selectedUser.set(data[0]);
    }
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

  selectUser(user: any | null) {
    this.selectedUser.set(user);
  }
}
