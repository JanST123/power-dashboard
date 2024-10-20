import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { PricesService } from './services/prices.service';
import { ConsumptionService } from './services/consumption.service';


@Controller()
export class AppController {
  constructor(
    private readonly pricesService: PricesService,
    private readonly consumptionService: ConsumptionService
  ) { }

  @Get()
  getData() {
    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
  }

  @Get('consumption')
  getConsumption() {
    return this.consumptionService.getAll();
  }

  @Get('prices')
  getPrices() {
    return this.pricesService.getAll();
  }
}
