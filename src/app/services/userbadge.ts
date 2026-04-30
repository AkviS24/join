import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class UserBadge {

  palette: string[] = [
    '#2E5BFF', '#D7263D', '#1B998B', '#F46036',
    '#662E9B', '#014b11', '#C1292E', '#44803F',
    '#54478C', '#048BA8', '#A4036F', '#ffe600',
    '#E5446D', '#FF9F1C', '#5E2BFF', '#006466',
    '#7B3F00', '#4A5859', '#916953', '#310D20'
  ];

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getColor(uid: number): string {
    let colorNumber = uid % this.palette.length;
    return this.palette[colorNumber];
  }

}
