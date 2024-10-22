import { AfterViewInit, Component, computed, effect, ElementRef, inject, input, LOCALE_ID, signal, ViewChild } from '@angular/core';
import Chart, { ChartDataset, ChartTypeRegistry, LegendItem, TooltipItem } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { VoltegoConsumptionDataset, VoltegoPrice } from '@power-dashboard/shared';
import { formatNumber } from '@angular/common';
import { ConfigService } from '../../../services/config.service';



@Component({
  standalone: true,
  selector: 'app-dashboard-chart',
  styleUrls: [
    './dashboard-chart.component.scss'
  ],
  templateUrl: './dashboard-chart.component.html'
})
export class DashboardChartComponent implements AfterViewInit {
  consumption = input<VoltegoConsumptionDataset>();
  prices = input<VoltegoPrice[]>();

  config = inject(ConfigService);
  locale = inject(LOCALE_ID);

  minPrice = computed(() => this.prices()?.map(p => parseFloat(p.priceAmount)).reduce((prev, current) => Math.min(prev, current)));
  maxPrice = computed(() => this.prices()?.map(p => parseFloat(p.priceAmount)).reduce((prev, current) => Math.max(prev, current)));

  maxConsumption = computed(() => this.consumption()?.values.map(v => v.value).reduce((prev, current) => Math.max(prev, current)));

  chart?: Chart;
  ready = signal(false);

  @ViewChild('chart') chartEl?: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      if (this.ready() && this.chartEl && this.chart) {

        const datasets: (ChartDataset)[] = [];
        let labels: (string | number)[] = [];

        // draw the consumption line
        if (this.consumption()?.values?.length) {
          datasets.push({
            type: 'line',
            label: 'Consumption',
            order: 1,
            borderColor: '#ff9d00',
            backgroundColor: '#ff9d0040',
            fill: 'origin',
            data: (this.consumption()?.values || []).map(v => ({ x: v.time, y: v.value })),
          });
          labels = this.consumption()?.values.map(v => v.time) || []

          // misuse the bar chart as colored background
          if (this.prices()?.length) {
            datasets.push({
              type: 'bar',
              label: 'Prices',
              order: 2,

              data: (this.consumption()?.values || []).map(v => {
                return {
                  x: v.time,
                  y: this.maxConsumption() || 0,
                }
              }),
              backgroundColor: (this.consumption()?.values || []).map(v => {
                // find the right price
                const d = new Date(v.time);
                const currentPrice = this.prices()?.find(p => p.priceHour === d.getHours());
                if (currentPrice) {
                  return this.#getPriceColor(parseFloat(currentPrice.priceAmount), true)
                }
                return 'grey';
              }),
            })
          }

        }


        console.log({ datasets, labels })

        this.chart.data.datasets = datasets;
        // this.chart.data.labels = labels;
        this.chart.update();


      }
    })
  }

  ngAfterViewInit(): void {
    if (this.chartEl) {
      this.ready.set(true);

      this.chart = new Chart(
        this.chartEl.nativeElement,
        {
          data: {
            datasets: []
          },
          options: {
            interaction: {
              intersect: false,
              mode: 'index'
            },
            scales: {
              xAxis: {
                type: 'time',
                time: {
                  unit: 'hour',
                },
                title: {
                  display: true,
                  text: 'Hour of day'
                },
                ticks: {
                  source: 'data'
                }
              },
              yAxis: {
                title: {
                  display: true,
                  text: 'Power Consumption (Watts)'
                },
              }
            },
            plugins: {
              legend: {
                labels: {
                  filter: (item: LegendItem) => {
                    // do not show the prices in the legend as this bar chart is only used as a "background"
                    if (item.datasetIndex === 1) {
                      return false;
                    }
                    return true;
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: (tooltipItem: TooltipItem<keyof ChartTypeRegistry>) => {
                    console.log({ tooltipItem })
                    if (tooltipItem.datasetIndex === 0) {
                      return tooltipItem.dataset.label + ': ' + tooltipItem.formattedValue + 'W';
                    }

                    if (tooltipItem.datasetIndex === 1) {
                      // find the right price
                      const d = new Date(tooltipItem.parsed.x);
                      const currentPrice = this.prices()?.find(p => p.priceHour === d.getHours());
                      if (currentPrice) {
                        return tooltipItem.dataset.label + ': ' + formatNumber(parseFloat(currentPrice.priceAmount) * 100, this.locale, '1.0000') + 'cent / kWh'
                      }
                    }

                    return tooltipItem.dataset.label + ': ' + tooltipItem.formattedValue;
                  },
                  // labelColor: (tooltipItem: TooltipItem<keyof ChartTypeRegistry>) => {
                  //   return {
                  //     backgroundColor: 'red',
                  //     borderColor: 'red'
                  //   }
                  // }
                }
              }
            }
          }
        }
      )
    }
  }


  /**
   * return the percentage of `value` between min and max
   */
  #getPercent(value: number) {
    const minPrice = this.minPrice();
    const maxPrice = this.maxPrice();
    if (minPrice !== undefined && maxPrice !== undefined) {
      return 100 * (value - minPrice) / (maxPrice - minPrice)
    }
    return -1
  }

  #getPriceColor(price: number, background = false) {
    const percent = this.#getPercent(price);

    let color = 'grey';
    switch (true) {
      case percent === -1: color = 'grey'; break;
      case percent < 5: color = '#4f9129'; break;
      case percent < 15: color = '#84c75d'; break;
      case percent < 25: color = '#bdd991'; break;
      case percent < 35: color = '#cad991'; break;
      case percent < 45: color = '#d5d991'; break;
      case percent < 55: color = '#eff584'; break;
      case percent < 65: color = '#f5ea84'; break;
      case percent < 75: color = '#f5db84'; break;
      case percent < 85: color = '#f5be84'; break;
      case percent < 95: color = '#f5a084'; break;
      case percent >= 95: color = '#FF0000'; break;
    }

    if (background) {
      color += '40';
    }

    return color;

  }
}
