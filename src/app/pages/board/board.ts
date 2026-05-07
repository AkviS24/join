import { Component, inject, computed } from '@angular/core';
import { Tasks } from '../../services/tasks';
import { SvgDb } from "../../shared/svg-db/svg-db";
import { UserBadge } from '../../services/userbadge';

@Component({
  selector: 'app-board',
  imports: [SvgDb],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  taskService = inject(Tasks);
  userBadgeService = inject(UserBadge);

  todoTasks = computed(() => 
    this.taskService.demoTasks().filter(t => t.status === 'todo')
  );
  
  inProgressTasks = computed(() => 
    this.taskService.demoTasks().filter(t => t.status === 'inProgress')
  );

  awaitFeedbackTasks = computed(() => 
    this.taskService.demoTasks().filter(t => t.status === 'awaitFeedback')
  );
  
  doneTasks = computed(() => 
    this.taskService.demoTasks().filter(t => t.status === 'done')
  );

  formatType(type: string): string {
  if (!type) return '';
  const result = type.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
} 

getDoneSubtasksCount(task: any): number {
  return task.subtasks.filter((s: any) => s.status === 'done').length;
}

  insertFunctionHere(){
    
  }
}
