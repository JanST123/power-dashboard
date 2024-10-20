import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriceCache } from '../entities/price-cache.entity';
import { DataSource, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { VoltegoPrice, VoltegoPricesResponse } from '@power-dashboard/shared';
import { filter, map, switchMap } from 'rxjs/operators';
import { forkJoin, from, of } from 'rxjs';
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
  getAll(date = 'now') {
    const d = date === 'now' ? Date.now() : Date.parse(date);
    const dateKey = new Date(d).toDateString()

    // first check if cached
    return from(this.pricesRepository.findOne({
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

    })).pipe(
      switchMap((priceCache) => {
        if (priceCache && priceCache.prices) {
          return of(priceCache.prices as VoltegoPrice[]);

        } else if (dateKey === new Date().toDateString()) {
          // if not cached and the requested date is today, fetch from AP
          return this.fetch().pipe(
            switchMap(result => {
              return this.saveToDb(result, dateKey);
            }),
          );

        } else {
          // we can only fetch todays prices and if they are not cached in the DB, we're out of luck...
          return of([] as VoltegoPrice[]);
        }
      })
    );
  }

  /**
   * save prices to the DB
   */
  private saveToDb(prices: VoltegoPrice[], dateKey: string) {

    const priceCache = new PriceCache();
    priceCache.date = dateKey;
    priceCache.lastUpdate = new Date();

    return from(this.dataSource.manager.save(priceCache)).pipe(
      switchMap(() => {
        const obs = prices.map(priceRow => {
          const row = new PriceCacheRow();
          row.priceCache = priceCache;
          Object.assign(row, priceRow);
          return from(this.pricesRepository.manager.save(row))
        });
        return forkJoin(obs);
      })
    );
  }



  /**
   * fetch todays prices
   */
  private fetch() {
    return this.httpService.get<VoltegoPricesResponse>('https://www.voltego.de/?type=9998').pipe(
      filter(response => !!response.data.length),
      map(response => response.data.at(0)?.prices)
    );
  }
}
