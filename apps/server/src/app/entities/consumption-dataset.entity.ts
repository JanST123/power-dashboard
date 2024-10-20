import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ConsumptionValue } from './consumption-value.entity';
import { Consumption } from './consumption.entity';

@Entity()
@Index(["consumption", "seriesType"], { unique: true })
export class ConsumptionDataset {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Consumption, (consumption) => consumption.datasets)
  consumption: Consumption

  @Column()
  meterSerialNumber: string;

  @Column()
  type: string;

  @Column()
  seriesKey: string;

  @Column({
    nullable: true
  })
  color: string;

  @Column()
  seriesType: string;

  @Column({
    nullable: true
  })
  fillArea: boolean;

  @Column({
    nullable: true
  })
  producersCost: number;

  @Column({
    nullable: true
  })
  producersCostPerKWh: number;

  @Column({
    nullable: true
  })
  costKey: string;

  @Column({
    nullable: true
  })
  cost: number;

  @Column()
  total: number;

  @Column()
  sortIndex: number;

  @OneToMany(() => ConsumptionValue, (row) => row.consumptionDataset)
  values: ConsumptionValue[]
}
