import { Component, inject, computed } from '@angular/core';
import { Tasks } from '../../services/tasks';
import { NgTemplateOutlet } from '@angular/common';
import { SvgDb } from "../../shared/svg-db/svg-db";
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  imports: [NgTemplateOutlet, SvgDb, DragDropModule],
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

  insertFunctionHere(){
    
  }
}
