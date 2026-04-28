import { Component } from '@angular/core';
import { UserAvatar } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-header',
  imports: [UserAvatar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
