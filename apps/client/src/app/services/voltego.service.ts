import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { filter } from 'rxjs';
import { config, VoltegoPrice, VoltegoConsumptionDataset } from '@power-dashboard/shared';

@Injectable({
  providedIn: 'root'
})
export class VoltegoService {
  #http = inject(HttpClient);

  getPrices() {
    return this.#http.get<VoltegoPrice[]>(config.apiUrl + '/prices').pipe(
      filter(response => !!response.length),
    );
  }


  getConsumption() {
    return this.#http.get<VoltegoConsumptionDataset[]>(config.apiUrl + '/consumption').pipe(
      filter(response => !!response.length),
    );
  }
}
