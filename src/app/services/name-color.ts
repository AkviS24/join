import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class NameColor {

  palette: string[] = [
    '#2E5BFF', '#D7263D', '#1B998B', '#F46036',
    '#662E9B', '#202C39', '#C1292E', '#44803F',
    '#54478C', '#048BA8', '#A4036F', '#2F2F2F',
    '#E5446D', '#FF9F1C', '#5E2BFF', '#006466'
  ];

  getInitials(firstname: string, name: string): string {
    let fullName = name + " " + firstname;
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getColor(uid: number): string {
    console.log(uid);

    let colorNumber = uid % 16;

    console.log(this.palette[colorNumber]);

    return this.palette[colorNumber];
  }
}
