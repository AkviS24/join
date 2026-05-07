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

  async updateTaskStatus(id: number, newStatus: string) {
    this.demoTasks.update(tasks =>
      tasks.map(t => t.id === id? {...t, status: newStatus} :t)
    );

    const {error} = await this.supabase
    .from('tasks')
    .update({status: newStatus})
    .eq('id', id)

    if(error) {
      console.error("Error updating task status:", error)
    }
  }
  
  async getTasks() {
    let { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('*')
    if (tasks) {
      this.demoTasks.set(tasks);
    }
  }

  async setTasks(demoData: { title: string, description: string, category: string, type: string, dueDate: string  }) {
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

