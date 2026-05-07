import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Tasks } from '../../services/tasks';
import { NgTemplateOutlet } from '@angular/common';
import { SvgDb } from "../../shared/svg-db/svg-db";
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgTemplateOutlet, SvgDb, DragDropModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnInit {
  taskService = inject(Tasks);
  searchQuery = signal('');

  ngOnInit(): void {
    this.taskService.getTasks();
  }


  filteredTasks = computed(() => {
    const tasks = this.taskService.demoTasks();
    const query = this. searchQuery().toLowerCase();

    if(!query) return tasks;

    return tasks.filter(t => 
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  });

  todoTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === 'todo')
  );
  
  inProgressTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === 'inProgress')
  );

  awaitFeedbackTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === 'awaitFeedback')
  );
  
  doneTasks = computed(() => 
    this.filteredTasks().filter(t => t.status === 'done')
  );

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer !== event.container) {
      const task = event.item.data;
      
      this.taskService.updateTaskStatus(task.id, newStatus);
    }
  }

  insertFunctionHere(){
    
  }
}
