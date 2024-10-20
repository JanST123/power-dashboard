import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PriceCacheRow } from './price-cache-row.entity';

@Entity()
export class PriceCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column({
    nullable: true
  })
  lastUpdate: Date;

  @OneToMany(() => PriceCacheRow, (row) => row.priceCache)
  prices: PriceCacheRow[]
}
