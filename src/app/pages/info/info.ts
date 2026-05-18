import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type InfoView = 'legal' | 'privacy' | 'help';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './info.html',
  styleUrls: ['./info.scss']
})
export class Info {
  private readonly route = inject(ActivatedRoute);

 active: InfoView = 'legal';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const view = params.get('view');
      this.active = this.isInfoView(view) ? view : 'legal';
    });
  }

  wechsleAnsicht(ansicht: InfoView) {
    this.active = ansicht;
  }

  private isInfoView(view: string | null): view is InfoView {
    return view === 'legal' || view === 'privacy' || view === 'help';
  }
}
