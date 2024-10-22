import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceCache } from '../entities/price-cache.entity';
import { DataSource, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { VoltegoPrice, VoltegoPricesResponse } from '@power-dashboard/shared';
import { filter, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { PriceCacheRow } from '../entities/price-cache-row.entity';


@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(PriceCache)
    private pricesRepository: Repository<PriceCache>,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource
  ) { }

  /**
   * returns observable resolving with all prices for the given date
   * @param date (string, must be parsable by Date.parse(), defaults to 'now')
   */
  async getAll(date = 'now') {
    const d = date === 'now' ? Date.now() : Date.parse(date);
    const dateKey = new Date(d).toDateString()

    // first check if cached
    const priceCache = await this.pricesRepository.findOne({
      where: {
        date: dateKey,
      },
      relations: {
        prices: true
      },
      order: {
        prices: {
          priceYear: 'ASC',
          priceMonth: 'ASC',
          priceHour: 'ASC',
          priceMinute: 'ASC',
        }
      }
    });

    if (priceCache && priceCache.prices) {
      return priceCache.prices as VoltegoPrice[];
    }

    if (dateKey === new Date().toDateString()) {
    // if not cached and the requested date is today, fetch from AP
      const freshPrices = await this.fetch();
      await this.saveToDb(freshPrices, dateKey);
    }

    return [] as VoltegoPrice[];
  }

  /**
   * save prices to the DB
   */
  private async saveToDb(prices: VoltegoPrice[], dateKey: string) {
    const priceCache = new PriceCache();
    priceCache.date = dateKey;
    priceCache.lastUpdate = new Date();

    await this.dataSource.manager.save(priceCache);

    for (const price of prices) {
      const row = new PriceCacheRow();
      row.priceCache = priceCache;
      Object.assign(row, price);
      await this.pricesRepository.manager.save(row);
    }
  }



  /**
   * fetch todays prices
   */
  private fetch() {
    return firstValueFrom(
      this.httpService.get<VoltegoPricesResponse>('https://www.voltego.de/?type=9998').pipe(
        filter(response => !!response.data.length),
        map(response => response.data.at(0)?.prices)
      )
    );
  }
}
