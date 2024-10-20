import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PriceCache } from './price-cache.entity';

@Entity()
export class PriceCacheRow {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PriceCache, (priceCache) => priceCache.prices)
  priceCache: PriceCache;

  @Column()
  pid: string;

  @Column()
  priceAmount: string;

  @Column()
  priceHour: number;

  @Column()
  priceMinute: number;

  @Column()
  priceMonth: number;

  @Column()
  priceYear: number;

  @Column()
  title: string;

  @Column()
  uid: string;
}
