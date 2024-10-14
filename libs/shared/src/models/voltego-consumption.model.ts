export interface VoltegoConsumptionValue {
  time: number;
  value: number;
  reading: number;
  reactiveReading: number;
  cost: number;
  selfConsumptionReward: number;
  isComputedValue: boolean;
}

export interface VoltegoConsumptionDataset {
  masterSerialNumber: string;
  type: string;
  values: VoltegoConsumptionValue[];
  seriesKey: string;
  color: string;
  seriesType: 'CONSUMPTION' | 'FEED',
  fillArea: boolean;
  producerCost: null;
  producerCostPerKwh: null;
  costKey: string;
  cost: null;
  total: number;
  sortIndex: number;
  extras?: unknown;
}

export type VoltegoConsumptionResult = {
  status: string;
  result: VoltegoConsumptionDataset[];
}
