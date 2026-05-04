import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-svg-db',
  imports: [],
  templateUrl: './svg-db.html',
  styleUrl: './svg-db.scss',
})
export class SvgDb {
  @Input() name: string = '';
}
