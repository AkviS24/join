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

  demoTasks = signal<
    {
      id: number;
      created_at: string;
      title: string;
      description: string;
      category: string;
      type: string;
      dueDate: string;
      due_date: string;
      priority: string;
      assignedTo: number[];
      assignedToNames: string[];
      subtasks: { subtaskText: string; completed: boolean }[];
      status: string;
    }[]
  >([]);

  async getTasks() {
    const { data: tasks, error } = await this.supabase.from('tasks').select('*');

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    if (!tasks) return;
    this.demoTasks.set(tasks);
  }

  async setTasks(demoData: {
    title: string;
    description: string;
    category: string;
    type: string;
    dueDate: string;
    due_date: string;
    priority: string;
    assignedTo: string[];
    assignedToNames: string[];
    subtasks: { subtaskText: string; completed: boolean }[];
    status: string;
  }) {
    const { data, error } = await this.supabase.from('tasks').insert([demoData]).select();

    if (error) {
      console.error('Error creating task:', error);
      return;
    }

    await this.getTasks();
  }

  async getupdateTasks(
    id: number,
    demoData: {
      title: string;
      description: string;
      category: string;
      type: string;
      dueDate: string;
      due_date: string;
      priority: string;
      assignedTo: string[];
      assignedToNames: string[];
      subtasks: { subtaskText: string; completed: boolean }[];
      status: string;
    }
  ) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(demoData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating task:', error);
      return;
    }

    await this.getTasks();
  }
}