import { Injectable, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';

type TaskPayload = {
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
};

@Injectable({
  providedIn: 'root',
})
export class Tasks {
  private readonly supabaseService = inject(Supabase);
  supabase = this.supabaseService.supabase;
  private channel?: RealtimeChannel | undefined;
  readonly isLoading = signal(true);

  constructor() {
    this.getTasks();
    this.setupRealtimeSubscription();
  }

  setupRealtimeSubscription() {
    this.channel = this.supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Realtime change received:', payload);
          this.getTasks();
        }
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }


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
      this.isLoading.set(false);
      return;
    }

    if (tasks) {
      this.demoTasks.set(tasks);
    }

    this.isLoading.set(false);
  }

  async setTasks(demoData: TaskPayload) {
    const { data, error } = await this.supabase.from('tasks').insert([demoData]).select();

    if (error) {
      console.error('Error creating task:', error);
      return;
    }

    await this.getTasks();
  }

  async importTasks(tasks: TaskPayload[]) {
    const { data, error } = await this.supabase.from('tasks').insert(tasks).select();

    if (error) {
      console.error('Error importing tasks:', error);
      return { data: null, error };
    }

    await this.getTasks();
    return { data, error: null };
  }

  async deleteData(id: number) {
    await this.supabase.from('tasks').delete().eq('id', id).select();
  }

  async updateTasksStatus(id: number, newStatus: string) {
    const { error } = await this.supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.log('Error updating Task:', error);
      return;
    }

    await this.getTasks();
  }

  async getupdateTasks(
    id: number,
    demoData: TaskPayload
  ) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(demoData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating task:', error);
      return { data: null, error };
    }

    await this.getTasks();
    return { data, error: null };
  }
}
