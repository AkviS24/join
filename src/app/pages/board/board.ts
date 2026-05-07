import { Component, inject, computed } from '@angular/core';
import { Tasks } from '../../services/tasks';
import { SvgDb } from "../../shared/svg-db/svg-db";

@Component({
  selector: 'app-board',
  imports: [SvgDb],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  taskService = inject(Tasks);

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

  insertFunctionHere(){
    
  }
}
