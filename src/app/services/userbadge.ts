import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserBadge {
  palette: string[] = [
    '#2E5BFF',
    '#D7263D',
    '#1B998B',
    '#F46036',
    '#662E9B',
    '#014b11',
    '#C1292E',
    '#44803F',
    '#54478C',
    '#048BA8',
    '#A4036F',
    '#ffe600',
    '#E5446D',
    '#FF9F1C',
    '#5E2BFF',
    '#006466',
    '#7B3F00',
    '#4A5859',
    '#916953',
    '#310D20',
  ];

  getInitials(name1?: string, name2?: string): string {
    const n1 = name1 && name1 !== 'null' ? name1 : '';
    const n2 = name2 && name2 !== 'null' ? name2 : '';
    let fullName = `${n1} ${n2}`.trim();
    let initialsName = fullName
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
       let compactInitialsName = initialsName[0];
      if (initialsName.length >= 2) {
        compactInitialsName = initialsName[0] + initialsName[initialsName.length - 1];
      } 
      return compactInitialsName;
  }

  getColor(uid: number): string {
    let colorNumber = uid % this.palette.length;
    return this.palette[colorNumber];
  }
}
