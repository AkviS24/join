import { Component, inject } from '@angular/core';
import { Tasks } from '../../services/tasks';

@Component({
  selector: 'app-board',
  imports: [],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  taskService = inject(Tasks);

  ngOnInit(){
    this.taskService.getTasks()
  }
}
