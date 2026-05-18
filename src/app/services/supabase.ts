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

  demoDaten = signal<
    {
      id: number;
      created_at: string;
      name: string;
      email: string;
      phone: number;
      loggedIn: boolean;
      password: string;
    }[]
  >([]);

  selectedUser = signal<any | null>(null);

  // NOTE:
  // This is only temporary local fake storage for tasks.
  // The data only stays available until the page is reloaded.
  // Later, this signal list can be replaced with Supabase.
  tasks = signal<any[]>([]);

  constructor() {
    this.initRealtimeSync();
  }

  initRealtimeSync() {
    this.supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demoDB' },
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
      let newList;

      if (payload.eventType === 'INSERT') {
        if (current.some((item) => item.id === payload.new.id)) return current;
        newList = [...current, payload.new];
      } else if (payload.eventType === 'UPDATE') {
        newList = current.map((item) =>
          item.id === payload.new.id ? payload.new : item
        );
      } else if (payload.eventType === 'DELETE') {
        return current.filter((item) => item.id !== payload.old.id);
      } else {
        return current;
      }

      return newList.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async setDemoData(demoData: {
    name: string;
    email: string;
    phone: number;
    password: string;
  }) {
    const { data, error } = await this.supabase
      .from('demoDB')
      .insert([demoData])
      .select();

    if (error) {
      console.error('Error saving demo data:', error);
      return;
    }

    if (data && data.length > 0) {
      this.selectedUser.set(data[0]);
    }

    // NOTE:
    // No getDemoData() call is needed here.
    // Realtime handles that.
  }

  async getupdateDemoData(
    id: number,
    name: string,
    email: string,
    phone: number,
    password: string
  ) {
    await this.supabase
      .from('demoDB')
      .update({ name, email, phone, password })
      .eq('id', id)
      .select();
  }

  async deleteData(id: number) {
    await this.supabase.from('demoDB').delete().eq('id', id).select();
  }

  selectUser(user: any | null) {
    this.selectedUser.set(user);
  }

  // NOTE:
  // This method temporarily replaces real database storage.
  // It stores tasks locally in the Angular signal.
  // This lets you test AddTask without a Supabase tasks table.
  async insertTask(task: any) {
    this.tasks.update((currentTasks) => [...currentTasks, task]);

    console.log('Fake task saved:', task);
    console.log('All fake tasks:', this.tasks());

    return task;
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }
}
