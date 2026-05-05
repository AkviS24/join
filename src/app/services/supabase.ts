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
  private channel?: RealtimeChannel | undefined;

  demoDaten = signal<{ id: number, created_at: string, name: string, email: string, phone: number, loggedIn: boolean, password: string }[]>([]);
  selectedUser = signal<any | null>(null);

  constructor() {
    this.initRealtimeSync();
  }


  initRealtimeSync() {
    this.supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demoDB' }, 
        (payload) => {
          console.log('Change received!', payload);
          this.handleRealtimePayload(payload);
        }
      )
      .subscribe();
  }

  async getDemoData() {
    let { data: demoDB } = await this.supabase
      .from('demoDB')
      .select('*')
      .order('name', { ascending: true });
    
    if (demoDB) {
      this.demoDaten.set(demoDB);
    }
  }

  private handleRealtimePayload(payload: any) {
    this.demoDaten.update((current) => {
      if (payload.eventType === 'INSERT') {
        const exists = current.some(item => item.id === payload.new.id);
        return exists ? current : [...current, payload.new];
      } 
      
      if (payload.eventType === 'UPDATE') {
        return current.map((item) => 
          item.id === payload.new.id ? payload.new : item
        );
      } 
      
      if (payload.eventType === 'DELETE') {
        return current.filter((item) => item.id !== payload.old.id);
      }
      
      return current;
    });
  }

  async setDemoData(demoData: { name: string, email: string, phone: number, password: string }) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .insert([demoData])
      .select();
    
    if (data && data.length > 0) {
      this.selectedUser.set(data[0]);
    }
    // HINWEIS: Du musst hier kein getDemoData() aufrufen, Realtime erledigt das!
  }

  async getupdateDemoData(id: number, name: string, email: string, phone: number, password: string) {
    await this.supabase
      .from('demoDB')
      .update({ name, email, phone, password })
      .eq('id', id)
      .select();
  }

  async deleteData(id: number) {
    await this.supabase
      .from('demoDB')
      .delete()
      .eq('id', id)
      .select();
  }

  selectUser(user: any | null) {
    this.selectedUser.set(user);
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }

}
