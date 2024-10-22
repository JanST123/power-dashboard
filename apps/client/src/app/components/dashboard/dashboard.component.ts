import { Component, inject } from '@angular/core';
import { VoltegoService } from '../../services/voltego.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { DashboardChartComponent } from './dashboard-chart/dashboard-chart.component';

@Component({
  imports: [
    CommonModule,
    DashboardChartComponent
  ],
  standalone: true,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  #voltego = inject(VoltegoService);

  consumption = toSignal(this.#voltego.getConsumption());
  prices = toSignal(this.#voltego.getPrices());

}
