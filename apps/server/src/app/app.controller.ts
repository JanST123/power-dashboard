import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { config, VoltegoConsumptionResult, VoltegoPricesResponse } from '@power-dashboard/shared';
import { filter, map } from 'rxjs/operators';


@Controller()
export class AppController {
  constructor(private readonly httpService: HttpService) { }

  @Get()
  getData() {
    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
  }

  @Get('consumption')
  getConsumption() {
    const from = new Date();
    from.setHours(0);
    from.setMinutes(0);
    from.setSeconds(0);
    from.setMilliseconds(0);

    const to = new Date();
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);
    to.setMilliseconds(9999);

    // TODO: cache

    return this.httpService.get<VoltegoConsumptionResult>('https://msb.voltego.de/json/WidgetJson.getPower', {
      params: {
        tokenId: config.voltegoGraphToken,
        from: String(from.getTime()),
        to: String(to.getTime()),
        interval: '900000', // the only working value = 15 min
        _: String(Date.now())
      }
    }).pipe(
      map(response => response.data.result)
    );
  }

  @Get('prices')
  getPrices() {
    // TODO: cache
    return this.httpService.get<VoltegoPricesResponse>('https://www.voltego.de/?type=9998').pipe(
      filter(response => !!response.data.length),
      map(response => response.data.at(0)?.prices)
    );
  }
}
