import { Injectable, signal } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Tasks {
  supabaseUrl = environment.supabaseUrl;
  supabaseKey = environment.supabaseKey;
  supabase = createClient(this.supabaseUrl, this.supabaseKey);
  private channel?: RealtimeChannel | undefined;

  demoTasks = signal<{ id: number, created_at: string, title: string, description: string, category: string, type: string, dueDate: string , due_date: string , priority: string , assignedTo: [] , assignedToNames: [] , subtasks: string , status: string }[]>([]);

  async getTasks() {

    let { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('*')
    if (!tasks) return
    this.demoTasks.set(tasks)

  }

  async setasks(demoData: { title: string, description: string, category: string, type: string, dueDate: string  }) {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert([demoData])
      .select()
  }

  async getupdateTasks(id: number, demoData: { title: string, description: string, category: string, type: string, dueDate: string }) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update([demoData])
      .eq('id', id)
      .select()
  }
}

