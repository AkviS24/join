import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-summary',
  imports: [RouterModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  supabaseService = inject(Supabase);

  // Holt sich in Echtzeit die Tasks aus dem Service
  get tasks() {
    return this.supabaseService.tasks();
  }

  // Alle Werte berechnen sich nun automatisch neu, sobald sich "tasks" ändert
  tasksInBoard = computed(() => this.tasks.length);
  tasksToDo = computed(() => this.tasks.filter((t: any) => t.category === 'category-0').length);
  tasksInProgress = computed(
    () => this.tasks.filter((t: any) => t.category === 'category-1').length,
  );
  tasksAwaitingFeedback = computed(
    () => this.tasks.filter((t: any) => t.category === 'category-2').length,
  );
  tasksDone = computed(() => this.tasks.filter((t: any) => t.category === 'category-3').length);

  tasksUrgent = computed(() => {
    return this.tasks.filter((t: any) => t.priority === 'urgent').length;
  });

  urgentDeadline = computed(() => {
    const urgentTasks = this.tasks.filter((t: any) => t.priority === 'urgent');
    if (urgentTasks.length > 0) {
      const sortedUrgent = urgentTasks.sort(
        (a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
      const closestDate = new Date(sortedUrgent[0].dueDate);
      return closestDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return '';
  });

  greetingText: string = 'Good morning,';
  userName: string = '';

  async ngOnInit() {
    this.userName = localStorage.getItem('userName') || 'Guest';
    this.setGreeting();
    await this.loadTasks();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingText = 'Good morning,';
    } else if (hour < 18) {
      this.greetingText = 'Good afternoon,';
    } else {
      this.greetingText = 'Good evening,';
    }
  }

  async loadTasks() {
    await this.supabaseService.getTasks();
  }
}
