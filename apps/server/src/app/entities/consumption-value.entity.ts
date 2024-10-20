import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConsumptionDataset } from './consumption-dataset.entity';

@Entity()
@Index(["consumptionDataset", "time"], { unique: true })
export class ConsumptionValue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ConsumptionDataset, (consumptionDataset) => consumptionDataset.values)
  consumptionDataset: ConsumptionDataset;

  @Column()
  time: number;

  @Column()
  value: number;

  @Column()
  reading: number;

  @Column()
  reactiveReading: number;

  @Column()
  cost: number;

  @Column()
  selfConsumptionReward: number;

  @Column()
  isComputedValue: boolean;
}
