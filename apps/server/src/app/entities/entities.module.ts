import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceCache } from './price-cache.entity';
import { PriceCacheRow } from './price-cache-row.entity';
import { Consumption } from './consumption.entity';
import { ConsumptionDataset } from './consumption-dataset.entity';
import { ConsumptionValue } from './consumption-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consumption,
      ConsumptionDataset,
      ConsumptionValue,
      PriceCache,
      PriceCacheRow
    ])
  ],
  exports: [TypeOrmModule]
})
export class EntityModule { }
