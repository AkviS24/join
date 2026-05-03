import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Task } from '../pages/board/board'; // Importiere das Task-Interface

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  [x: string]: any;
  // Ersetze diese beiden Werte mit deinen EXAKTEN Daten aus Supabase:
  supabaseUrl = 'https://deswubfoaaibnfhupxrc.supabase.co';
  supabaseKey = 'sb_publishable_iFe9Gw4VWOKIKI2Bbp1sKw_6oVf60yS';

  supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey);

  // Signals für die Daten
  contacts = signal<
    {
      id: number;
      created_at?: string;
      name: string;
      email: string;
      phone: number;
      color?: string;
      initials?: string;
    }[]
  >([]);
  tasks = signal<Task[]>([]);

  contactChannel: RealtimeChannel | undefined;
  taskChannel: RealtimeChannel | undefined;

  constructor() {}

  // --- Methoden für Kontakte (contacts) ---
  async getDemoData() {
    let { data: contacts, error } = await this.supabase
      .from('contacts') // Name der Tabelle korrigiert
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Daten:', error.message);
      return;
    }

    if (contacts) {
      this.contacts.set(contacts);
    }

    // Realtime-Updates aktivieren
    if (!this.contactChannel) {
      this.contactChannel = this.supabase
        .channel('contacts-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
          console.log('Änderung in contacts empfangen!', payload);
          this.getDemoData(); // Daten bei Änderungen neu laden
        })
        .subscribe();
    }
  }

  ngOnDestroy() {
    if (this.contactChannel) {
      this.supabase.removeChannel(this.contactChannel);
    }
    if (this.taskChannel) {
      this.supabase.removeChannel(this.taskChannel);
    }
  }

  async setDemoData(contactData: { name: string; email: string; phone: number }) {
    const { data, error } = await this.supabase
      .from('contacts') // Name der Tabelle korrigiert
      .insert([contactData])
      .select();

    if (error) console.error('Fehler beim Speichern:', error.message);
    return { data, error };
  }

  async updateDemoData(id: number, name: string, email: string, phone: number) {
    const { data, error } = await this.supabase
      .from('contacts') // Name der Tabelle korrigiert
      .update({ name, email, phone })
      .eq('id', id)
      .select();

    if (error) console.error('Fehler beim Update:', error.message);
    return { data, error };
  }

  async deleteData(id: number) {
    const { error } = await this.supabase
      .from('contacts') // Name der Tabelle korrigiert
      .delete()
      .eq('id', id);

    if (error) console.error('Fehler beim Löschen:', error.message);
  }

  // --- Methoden für Tasks (tasks) ---
  async getTasks() {
    let { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: true }); // Sortierung wie zuvor

    if (error) {
      console.error('Fehler beim Laden der Tasks:', error.message);
      return;
    }

    if (tasks) {
      this.tasks.set(tasks as Task[]); // Type assertion, da Supabase 'any' zurückgibt
    }

    // Realtime-Updates aktivieren
    if (!this.taskChannel) {
      this.taskChannel = this.supabase
        .channel('tasks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          console.log('Änderung in tasks empfangen!', payload);
          this.getTasks(); // Tasks bei Änderungen neu laden
        })
        .subscribe();
    }
  }

  async insertTask(task: Task) {
    // id wird in Angular erzeugt, weil die DB sie nicht auto-generiert
    const { data, error } = await this.supabase.from('tasks').insert([task]).select();
    if (error) console.error('Fehler beim Einfügen des Tasks:', error.message);
    return data;
  }

  async updateTask(id: number, task: Partial<Task>) {
    const { data, error } = await this.supabase.from('tasks').update(task).eq('id', id).select();
    if (error) console.error('Fehler beim Aktualisieren des Tasks:', error.message);
    return data;
  }

  async deleteTaskSupabase(id: number) {
    const { error } = await this.supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Fehler beim Löschen des Tasks:', error.message);
  }
}
