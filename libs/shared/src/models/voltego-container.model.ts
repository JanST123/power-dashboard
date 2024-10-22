export interface VoltegoContainerInformation {
  showMarketPricesView: boolean;
  lastMeasurementTime: number;
  firstMeasurementTime: number;
  firstLoadMeasurementTime: number;
  offline: boolean;
  feedInRemuneration: null;
  solution: string;
  measurementType: string;
  tariff_pricePerkWh: null;
  tariff_secondaryPricePerkWh: null;
  lastLoadMeasurementTime: number;
  measurementInterval: number;
  producerType: string;
  showDisaggregationView: boolean;
  tariff_monthlyBasePrice: null;
  consumptionColor: string;
  liveCycleStartTime: number;
  producerKey: string;
  houseIconColor: string;
};

export type VoltegoContainerResult = {
  status: string;
  result: VoltegoContainerInformation
}
