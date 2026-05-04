import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-discription',
  imports: [RouterModule],
  templateUrl: './discription.html',
  styleUrl: './discription.scss',
})
export class Discription {
  constructor(private router: Router) {}
}
