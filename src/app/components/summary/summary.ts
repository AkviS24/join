import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-summary',
  imports: [RouterModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  tasksToDo: number = 0;
  tasksDone: number = 0;
  tasksUrgent: number = 0;
  urgentDeadline: string = '';
  tasksInBoard: number = 0;
  tasksInProgress: number = 0;
  tasksAwaitingFeedback: number = 0;

  greetingText: string = 'Good morning,';
  userName: string = '';

  ngOnInit(): void {
    this.userName = localStorage.getItem('userName') || 'Guest';
    this.setGreeting();
    this.loadTasks();
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

  loadTasks(): void {
    const storedTasks = localStorage.getItem('join_test_db');
    if (storedTasks) {
      const tasks = JSON.parse(storedTasks);

      this.tasksInBoard = tasks.length;
      this.tasksToDo = tasks.filter((t: any) => t.category === 'category-0').length;
      this.tasksInProgress = tasks.filter((t: any) => t.category === 'category-1').length;
      this.tasksAwaitingFeedback = tasks.filter((t: any) => t.category === 'category-2').length;
      this.tasksDone = tasks.filter((t: any) => t.category === 'category-3').length;

      const urgentTasks = tasks.filter((t: any) => t.priority === 'urgent');
      this.tasksUrgent = urgentTasks.length;

      if (urgentTasks.length > 0) {
        const sortedUrgent = urgentTasks.sort(
          (a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
        const closestDate = new Date(sortedUrgent[0].dueDate);

        this.urgentDeadline = closestDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
  }
}
