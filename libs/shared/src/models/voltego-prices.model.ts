export interface VoltegoPrice {
  pid: string;
  priceAmount: string;
  priceHour: number;
  priceMinute: number;
  priceMonth: number;
  priceYear: number;
  title: string;
  uid: string;
}

export type VoltegoPricesResponse = {
  prices: VoltegoPrice[]
}[];

