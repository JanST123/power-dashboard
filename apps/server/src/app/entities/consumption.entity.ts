import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ConsumptionDataset } from './consumption-dataset.entity';

@Entity()
export class Consumption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from: number;

  @Column()
  to: number;

  @Column({
    nullable: true
  })
  lastUpdate: Date;

  @OneToMany(() => ConsumptionDataset, (row) => row.consumption)
  datasets: ConsumptionDataset[]
}
