/**
 * チャート生成サービス
 * データソースからデータを取得してチャートを生成します
 */

import { ChartGenerator, ChartSeries, ChartDataPoint, AttributionInfo } from './chartGenerator.js';
import { WorldBankClient } from '../sources/worldbank.js';
import { EStatClient } from '../sources/estat.js';
import { GenerateChartArgs } from '../types.js';
import { getAttribution } from './attribution.js';

export class ChartService {
    constructor(
        private worldbankClient: WorldBankClient | null,
        private estatClient: EStatClient | null
    ) {}

    /**
     * チャートを生成
     */
    async generateChart(args: GenerateChartArgs): Promise<string> {
        // データを取得
        const chartData = await this.fetchData(args);

        // 出典情報を取得
        const attribution = getAttribution(
            args.dataSource,
            args.dataParams.indicatorCode,
            args.dataParams.statsDataId
        );

        // チャートを生成
        const generator = new ChartGenerator({
            title: args.title,
            xLabel: args.xLabel,
            yLabel: args.yLabel,
            width: args.width,
            height: args.height,
            attribution: attribution as AttributionInfo,
        });

        switch (args.chartType) {
            case 'line':
                return generator.generateLineChart(chartData.series);
            case 'bar':
                return generator.generateBarChart(chartData.series);
            case 'pie':
                return generator.generatePieChart(chartData.dataPoints);
            default:
                throw new Error(`Unsupported chart type: ${args.chartType}`);
        }
    }

    /**
     * データソースからデータを取得
     */
    private async fetchData(args: GenerateChartArgs): Promise<{ series: ChartSeries[]; dataPoints: ChartDataPoint[] }> {
        if (args.dataSource === 'worldbank') {
            return await this.fetchWorldBankData(args);
        } else if (args.dataSource === 'estat') {
            return await this.fetchEStatData(args);
        } else {
            throw new Error(`Unsupported data source: ${args.dataSource}`);
        }
    }

    /**
     * World Bankからデータを取得
     */
    private async fetchWorldBankData(args: GenerateChartArgs): Promise<{ series: ChartSeries[]; dataPoints: ChartDataPoint[] }> {
        if (!this.worldbankClient) {
            throw new Error('World Bank client is not available');
        }

        const { countryCode, indicatorCode, startYear, endYear } = args.dataParams;
        if (!countryCode || !indicatorCode) {
            throw new Error('countryCode and indicatorCode are required for World Bank data');
        }

        const data = await this.worldbankClient.getIndicatorData({
            countryCode,
            indicatorCode,
            startYear,
            endYear,
        });

        // 国ごとに系列を分ける
        const countries = new Set<string>();
        data.forEach(d => {
            if (d.countryiso3code) {
                countries.add(d.countryiso3code);
            }
        });

        const series: ChartSeries[] = [];
        const dataPoints: ChartDataPoint[] = [];

        countries.forEach(countryCode => {
            const countryData = data.filter(d => d.countryiso3code === countryCode);
            const points: ChartDataPoint[] = countryData
                .filter(d => d.value !== null && d.value !== undefined)
                .map(d => ({
                    label: d.date || '',
                    value: d.value as number,
                }))
                .sort((a, b) => parseInt(a.label) - parseInt(b.label));

            if (points.length > 0) {
                series.push({
                    name: countryData[0]?.country?.value || countryCode,
                    data: points,
                });

                // 円グラフ用のデータポイント（最新年のデータ）
                if (points.length > 0) {
                    const latest = points[points.length - 1];
                    dataPoints.push({
                        label: countryData[0]?.country?.value || countryCode,
                        value: latest.value,
                    });
                }
            }
        });

        return { series, dataPoints };
    }

    /**
     * e-Statからデータを取得
     */
    private async fetchEStatData(args: GenerateChartArgs): Promise<{ series: ChartSeries[]; dataPoints: ChartDataPoint[] }> {
        if (!this.estatClient) {
            throw new Error('e-Stat client is not available');
        }

        const { statsDataId, limit } = args.dataParams;
        if (!statsDataId) {
            throw new Error('statsDataId is required for e-Stat data');
        }

        const data = await this.estatClient.getStatsData({
            statsDataId,
            limit: limit || 100,
        });

        // e-Statのデータ構造に応じて変換
        // ここでは簡易的な実装。実際のデータ構造に応じて調整が必要
        const series: ChartSeries[] = [];
        const dataPoints: ChartDataPoint[] = [];

        // データが配列の場合
        if (Array.isArray(data)) {
            data.forEach((item: any, index: number) => {
                if (item.value !== null && item.value !== undefined && item.label) {
                    dataPoints.push({
                        label: item.label,
                        value: parseFloat(item.value) || 0,
                    });
                }
            });
        }

        // 単一系列として扱う
        if (dataPoints.length > 0) {
            series.push({
                name: 'データ',
                data: dataPoints,
            });
        }

        return { series, dataPoints };
    }
}
