import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { VoltegoConsumptionDataset, VoltegoConsumptionResult, VoltegoContainerResult, config } from '@power-dashboard/shared';
import { map, tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
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
   * returns information about the "container" e.g. the first- and last measurements etc
   */
  getContainerInformation() {
    return firstValueFrom(
      this.httpService.get<VoltegoContainerResult>('https://msb.voltego.de/json/WidgetJson.getContainer', {
        params: {
          containerId: config.voltegoGraphToken,
          tokenId: config.voltegoGraphToken,
        }
      }).pipe(
        map(response => response.data?.result)
      )
    );
  }

  /**
   * returns observable resolving with consumption data, also stores all the data in the database (but does not read from database)
   */
  async getAll(fromDate?: Date, toDate?: Date) {

    const containerInformation = await this.getContainerInformation();

    console.log({ containerInformation })

    if (!fromDate) {
      fromDate = new Date(containerInformation.lastMeasurementTime);
      fromDate.setHours(0);
      fromDate.setMinutes(0);
      fromDate.setSeconds(0);
      fromDate.setMilliseconds(0);
    }

    if (!toDate) {
      toDate = new Date(containerInformation.lastMeasurementTime);
      toDate.setHours(23);
      toDate.setMinutes(59);
      toDate.setSeconds(59);
      toDate.setMilliseconds(9999);
    }

    console.log({ fromDate, toDate })

    const consumptionResult = await firstValueFrom(
      this.httpService.get<VoltegoConsumptionResult & { status?: string; reason?: string }>('https://msb.voltego.de/json/WidgetJson.getPower', {
        params: {
          tokenId: config.voltegoGraphToken,
          from: String(fromDate.getTime()),
          to: String(toDate.getTime()),
          interval: '900000', // the only working value = 15 min
          _: String(Date.now())
        }
      }).pipe(
        tap(response => {
          if (response.data?.status === 'error') {
            throw new HttpException('Consumption API Error: ' + (response.data.reason || 'unknown error'), HttpStatus.INTERNAL_SERVER_ERROR)
          }
        }),
        map(response =>
          response.data.result.map(dataset => {
        // resolve relative time/value to absolute values!
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
        )
      )
    );

    await this.saveToDb(consumptionResult, fromDate, toDate);

    return consumptionResult;
  }

  /**
   * save consumption to the DB
   */
  private async saveToDb(datasets: VoltegoConsumptionDataset[], fromDate: Date, toDate: Date) {
    let consumptionEntity = await this.consumptionRepository.findOne({
      where: {
        from: fromDate.getTime(),
        to: toDate.getTime(),
      }
    });

    if (!consumptionEntity) {
      // if we don't have consumption entity yet, create one
      consumptionEntity = new Consumption();
      consumptionEntity.from = fromDate.getTime();
      consumptionEntity.to = toDate.getTime();
    }

    // always update last_update
    consumptionEntity.lastUpdate = new Date();
    await this.dataSource.manager.save(consumptionEntity);

    // due to a bug in sqlite implementation of typeorm we first delete all consumptionDatasets and consumptionValues for that entity from the database
    const consumptionDatasets = await this.dataSource.manager.findBy(ConsumptionDataset, {
      consumption: consumptionEntity
    });

    for (const consumptionDataset of consumptionDatasets) {
      await this.dataSource.manager.delete(ConsumptionValue, { consumptionDataset: consumptionDataset });
      await this.dataSource.manager.delete(ConsumptionDataset, { id: consumptionDataset.id });
    }

    // now write the data to the database
    for (const dataset of datasets) {
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

      await this.dataSource.manager.save(datasetEntity);

      // save the values
      for (const value of (dataset.values)) {
        const valueEntity = new ConsumptionValue();
        valueEntity.consumptionDataset = datasetEntity;
        valueEntity.cost = value.cost;
        valueEntity.isComputedValue = value.isComputedValue;
        valueEntity.reactiveReading = value.reactiveReading;
        valueEntity.reading = value.reading;
        valueEntity.selfConsumptionReward = value.selfConsumptionReward;
        valueEntity.time = value.time;
        valueEntity.value = value.value;

        await this.dataSource.manager.save(valueEntity);
      }
    }
  }




}
