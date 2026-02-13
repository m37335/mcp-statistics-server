/**
 * データエクスポートサービス
 * 専門ツールで分析しやすい形式にデータを変換・出力します
 */

import { WorldBankClient } from '../sources/worldbank.js';
import { EStatClient } from '../sources/estat.js';
import { ExportDataArgs } from '../types.js';
import {
    formatAsCSV,
    formatAsJSON,
    formatWorldBankDataForAnalysis,
    formatEStatDataForAnalysis,
    formatAsTimeSeries,
    formatAsPivot,
} from '../utils/dataFormatter.js';

export class DataExportService {
    constructor(
        private worldbankClient: WorldBankClient | null,
        private estatClient: EStatClient | null
    ) {}

    /**
     * データをエクスポート
     */
    async exportData(args: ExportDataArgs): Promise<{ format: string; data: string | object; metadata?: object }> {
        // データを取得
        const rawData = await this.fetchData(args);
        
        // データを整形
        let formattedData = this.formatDataForSource(rawData, args.dataSource);
        
        // 変換オプションを適用
        if (args.transform) {
            formattedData = this.applyTransformations(formattedData, args.transform);
        }
        
        // 指定された形式で出力
        switch (args.format) {
            case 'csv':
                return {
                    format: 'csv',
                    data: formatAsCSV(formattedData),
                    metadata: {
                        source: args.dataSource,
                        columns: formattedData.length > 0 ? Object.keys(formattedData[0]) : [],
                        rowCount: formattedData.length,
                    },
                };
            
            case 'json':
                return {
                    format: 'json',
                    data: formattedData,
                    metadata: {
                        source: args.dataSource,
                        columns: formattedData.length > 0 ? Object.keys(formattedData[0]) : [],
                        rowCount: formattedData.length,
                    },
                };
            
            case 'json-structured':
                return {
                    format: 'json-structured',
                    data: formatAsJSON(formattedData, {
                        source: args.dataSource,
                        exportedAt: new Date().toISOString(),
                    }),
                    metadata: {
                        source: args.dataSource,
                        columns: formattedData.length > 0 ? Object.keys(formattedData[0]) : [],
                        rowCount: formattedData.length,
                    },
                };
            
            default:
                throw new Error(`Unsupported format: ${args.format}`);
        }
    }

    /**
     * データソースからデータを取得
     */
    private async fetchData(args: ExportDataArgs): Promise<any> {
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
    private async fetchWorldBankData(args: ExportDataArgs): Promise<any> {
        if (!this.worldbankClient) {
            throw new Error('World Bank client is not available');
        }

        const { countryCode, indicatorCode, startYear, endYear } = args.dataParams;
        if (!countryCode || !indicatorCode) {
            throw new Error('countryCode and indicatorCode are required for World Bank data');
        }

        return await this.worldbankClient.getIndicatorData({
            countryCode,
            indicatorCode,
            startYear,
            endYear,
        });
    }

    /**
     * e-Statからデータを取得
     */
    private async fetchEStatData(args: ExportDataArgs): Promise<any> {
        if (!this.estatClient) {
            throw new Error('e-Stat client is not available');
        }

        const { statsDataId, limit } = args.dataParams;
        if (!statsDataId) {
            throw new Error('statsDataId is required for e-Stat data');
        }

        return await this.estatClient.getStatsData({
            statsDataId,
            limit: limit || 10000,
        });
    }

    /**
     * データソースに応じてデータを整形
     */
    private formatDataForSource(rawData: any, dataSource: string): Array<Record<string, unknown>> {
        if (dataSource === 'worldbank') {
            return formatWorldBankDataForAnalysis(rawData);
        } else if (dataSource === 'estat') {
            return formatEStatDataForAnalysis(rawData);
        }
        return [];
    }

    /**
     * 変換オプションを適用
     */
    private applyTransformations(
        data: Array<Record<string, unknown>>,
        transform: ExportDataArgs['transform']
    ): Array<Record<string, unknown>> {
        if (!transform) return data;
        
        let result = data;

        // フィルタリング
        if (transform.filter) {
            result = result.filter(row => {
                return Object.entries(transform.filter!).every(([key, value]) => {
                    return row[key] === value;
                });
            });
        }

        // ソート
        if (transform.sort && transform.sort.length > 0) {
            result = [...result].sort((a, b) => {
                for (const sort of transform.sort!) {
                    const aVal = a[sort.column];
                    const bVal = b[sort.column];
                    // 型安全な比較
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        if (aVal < bVal) return sort.order === 'asc' ? -1 : 1;
                        if (aVal > bVal) return sort.order === 'asc' ? 1 : -1;
                    } else {
                        const aStr = String(aVal);
                        const bStr = String(bVal);
                        if (aStr < bStr) return sort.order === 'asc' ? -1 : 1;
                        if (aStr > bStr) return sort.order === 'asc' ? 1 : -1;
                    }
                }
                return 0;
            });
        }

        // 時系列形式に変換
        if (transform.asTimeSeries) {
            result = formatAsTimeSeries(
                result,
                transform.asTimeSeries.dateColumn,
                transform.asTimeSeries.valueColumn,
                transform.asTimeSeries.groupColumn
            );
        }

        // ピボット形式に変換
        if (transform.asPivot) {
            result = formatAsPivot(
                result,
                transform.asPivot.indexColumn,
                transform.asPivot.columnsColumn,
                transform.asPivot.valuesColumn
            );
        }

        return result;
    }
}
