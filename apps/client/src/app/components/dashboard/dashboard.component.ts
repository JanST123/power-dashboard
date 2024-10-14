import { Component, inject } from '@angular/core';
import { VoltegoService } from '../../services/voltego.service';
import { Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  imports: [
    CommonModule,
  ],
  standalone: true,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  #voltego = inject(VoltegoService);
  #destroyed$ = new Subject<void>();

  consumption = toSignal(this.#voltego.getConsumption());
  prices = toSignal(this.#voltego.getPrices());

}
