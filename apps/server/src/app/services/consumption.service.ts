import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { VoltegoConsumptionDataset, VoltegoConsumptionResult, config } from '@power-dashboard/shared';
import { map, switchMap } from 'rxjs/operators';
import { forkJoin, from } from 'rxjs';
import { Consumption } from '../entities/consumption.entity';
import { ConsumptionDataset } from '../entities/consumption-dataset.entity';
import { ConsumptionValue } from '../entities/consumption-value.entity';


@Injectable()
export class ConsumptionService {
  constructor(
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource
  ) { }

  /**
   * returns observable resolving with consumption data, also stores all the data in the database (but does not read from database)
   */
  getAll(fromDate?: Date, toDate?: Date) {

    if (!fromDate) {
      fromDate = new Date();
      fromDate.setHours(0);
      fromDate.setMinutes(0);
      fromDate.setSeconds(0);
      fromDate.setMilliseconds(0);
    }

    if (!toDate) {
      toDate = new Date();
      toDate.setHours(23);
      toDate.setMinutes(59);
      toDate.setSeconds(59);
      toDate.setMilliseconds(9999);
    }


    return this.httpService.get<VoltegoConsumptionResult>('https://msb.voltego.de/json/WidgetJson.getPower', {
      params: {
        tokenId: config.voltegoGraphToken,
        from: String(fromDate.getTime()),
        to: String(toDate.getTime()),
        interval: '900000', // the only working value = 15 min
        _: String(Date.now())
      }
    }).pipe(
      // we resolve the relative values (time, value) to absolute values to have unique db keys etc.
      map(response => ({
        ...response,
        data: {
          ...response.data,
          result: response.data.result.map(dataset => {
            let lastTime: number | null = null;
            let lastValue: number | null = null;
            return {
              ...dataset,
              values: dataset.values.map(value => {
                if (lastTime === null) {
                  lastTime = value.time;
                } else {
                  lastTime += value.time;
                }
                if (lastValue === null) {
                  lastValue = value.value;
                } else {
                  lastValue += value.value;
                }
                return {
                  ...value,
                  value: lastValue,
                  time: lastTime
                }
              })
            }
          })
        }
      })),
      switchMap(response => this.saveToDb(response.data.result, fromDate, toDate).pipe(
        map(() => response.data.result) // map back to the original fetch result, we only care that DB save operation is done, not about the result
      ))
    );
  }

  /**
   * save consumption to the DB
   */
  private saveToDb(datasets: VoltegoConsumptionDataset[], fromDate: Date, toDate: Date) {
    return from(
      this.consumptionRepository.findOne({
        where: {
          from: fromDate.getTime(),
          to: toDate.getTime(),
        }
      })
    ).pipe(
      switchMap(consumptionEntity => {
        if (!consumptionEntity) {
          consumptionEntity = new Consumption();
          consumptionEntity.from = fromDate.getTime();
          consumptionEntity.to = toDate.getTime();
        }

        consumptionEntity.lastUpdate = new Date();

        return from(this.dataSource.manager.save(consumptionEntity));
      }),
      switchMap(consumptionEntity => {
        // delete existing datasets and values (cause due to a bug in TypeORM the save() method does not correctly upsert )
        return from(this.dataSource.manager.findBy(ConsumptionDataset, {
          consumption: consumptionEntity
        })).pipe(
          switchMap(datasets => {
            const obs = datasets.map(dataset => {
              return forkJoin([
                // delete values
                this.dataSource.manager.delete(ConsumptionValue, { consumptionDataset: dataset }),
                // delete datasets itself
                this.dataSource.manager.delete(ConsumptionDataset, { id: dataset.id })
              ]);
            });
            return forkJoin(obs);
          }),
          map(() => consumptionEntity) // map back to the entity
        )
      }),
      switchMap(consumptionEntity => {
        const obs = datasets.map(dataset => {
          const datasetEntity = new ConsumptionDataset();
          datasetEntity.consumption = consumptionEntity;
          datasetEntity.color = dataset.color;
          datasetEntity.meterSerialNumber = dataset.meterSerialNumber;
          datasetEntity.type = dataset.type;
          datasetEntity.seriesKey = dataset.seriesKey;
          datasetEntity.seriesType = dataset.seriesType;
          datasetEntity.fillArea = dataset.fillArea;
          datasetEntity.producersCost = dataset.producerCost;
          datasetEntity.producersCostPerKWh = dataset.producerCostPerKwh;
          datasetEntity.costKey = dataset.costKey;
          datasetEntity.cost = dataset.cost;
          datasetEntity.total = dataset.total;
          datasetEntity.sortIndex = dataset.sortIndex;
          datasetEntity.values = [];

          return from(this.dataSource.manager.save(datasetEntity)).pipe(
            switchMap((datasetEntity2) => {
              const innerobs = dataset.values.map(value => {
                const valueEntity = new ConsumptionValue();
                valueEntity.consumptionDataset = datasetEntity2;
                valueEntity.cost = value.cost;
                valueEntity.isComputedValue = value.isComputedValue;
                valueEntity.reactiveReading = value.reactiveReading;
                valueEntity.reading = value.reading;
                valueEntity.selfConsumptionReward = value.selfConsumptionReward;
                valueEntity.time = value.time;
                valueEntity.value = value.value;

                return from(this.dataSource.manager.save(valueEntity));
              })

              return forkJoin(innerobs);
            })
          )
        });

        return forkJoin(obs);
      })
    );
  }




}
