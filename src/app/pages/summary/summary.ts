import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Tasks } from '../../services/tasks';

@Component({
  selector: 'app-summary',
  imports: [RouterModule],
  templateUrl: './summary.html',
  styleUrls: ['./summary.scss', './summary-responsive.scss'],
})
export class Summary implements OnInit, OnDestroy {
  taskService = inject(Tasks);
  private greetingTimer: ReturnType<typeof setInterval> | null = null;

  get tasks() {
    return this.taskService.demoTasks();
  }

  private taskStats = computed(() => {
    const stats = {
      board: 0,
      todo: 0,
      inProgress: 0,
      awaitingFeedback: 0,
      done: 0,
      urgent: 0,
      urgentDeadline: '',
    };
    let closestUrgentTime = Number.POSITIVE_INFINITY;

    for (const task of this.tasks) {
      stats.board++;

      if (task.status === 'todo') stats.todo++;
      if (task.status === 'inProgress') stats.inProgress++;
      if (task.status === 'awaitFeedback') stats.awaitingFeedback++;
      if (task.status === 'done') stats.done++;
      if ((task as any).priority === 'urgent') {
        stats.urgent++;

        const dueTime = new Date(task.due_date || task.dueDate).getTime();
        if (!Number.isNaN(dueTime) && dueTime < closestUrgentTime) {
          closestUrgentTime = dueTime;
          stats.urgentDeadline = new Date(dueTime).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }
      }
    }

    return stats;
  });

  tasksInBoard = computed(() => this.taskStats().board);
  tasksToDo = computed(() => this.taskStats().todo);
  tasksInProgress = computed(() => this.taskStats().inProgress);
  tasksAwaitingFeedback = computed(() => this.taskStats().awaitingFeedback);
  tasksDone = computed(() => this.taskStats().done);
  tasksUrgent = computed(() => this.taskStats().urgent);
  urgentDeadline = computed(() => this.taskStats().urgentDeadline);

  greetingText: string = 'Good morning,';
  userName: string = '';
  isGuestUser: boolean = false;

  async ngOnInit() {
    this.isGuestUser = localStorage.getItem('joinIsGuest') === 'true';
    this.userName = this.isGuestUser ? '' : localStorage.getItem('userName') || '';
    this.setGreeting();
    this.startGreetingTimer();
    await this.loadTasks();
  }

  ngOnDestroy(): void {
    if (this.greetingTimer) {
      clearInterval(this.greetingTimer);
      this.greetingTimer = null;
    }
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingText = this.isGuestUser ? 'Good morning!' : 'Good morning,';
    } else if (hour < 18) {
      this.greetingText = this.isGuestUser ? 'Good afternoon!' : 'Good afternoon,';
    } else {
      this.greetingText = this.isGuestUser ? 'Good evening!' : 'Good evening,';
    }
  }

  private startGreetingTimer(): void {
    this.greetingTimer = setInterval(() => this.setGreeting(), 60_000);
  }

  async loadTasks() {
    await this.taskService.getTasks();
  }
}
