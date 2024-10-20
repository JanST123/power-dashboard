import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { PricesService } from './services/prices.service';
import { EntityModule } from './entities/entities.module';
import { ConsumptionService } from './services/consumption.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: __dirname + '/../../data/power.sqlite',
      entities: [],
      synchronize: process.env.NODE_ENV === 'development',
      autoLoadEntities: true
    }),
    EntityModule
  ],
  controllers: [AppController],
  providers: [
    ConsumptionService,
    PricesService
  ],
})
export class AppModule {}
