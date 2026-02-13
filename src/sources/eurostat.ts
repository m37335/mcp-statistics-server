import axios from 'axios';

export interface EurostatConfig {
    baseUrl: string;
}

export class EurostatClient {
    private config: EurostatConfig;

    constructor(config: EurostatConfig) {
        this.config = config;
    }

    /**
     * 統計データを取得（JSON-stat形式）
     */
    async getData(params: {
        datasetCode: string;
        filters?: Record<string, string>;
        lang?: string;
    }): Promise<any> {
        try {
            const url = `${this.config.baseUrl}/data/${params.datasetCode}`;

            const queryParams: Record<string, string> = {
                format: 'JSON',
                lang: params.lang || 'EN',
                ...params.filters,
            };

            const response = await axios.get(url, {
                params: queryParams,
            });

            return response.data;
        } catch (error) {
            throw new Error(`Eurostat API error: ${error}`);
        }
    }

    /**
     * データセットのメタデータを取得
     */
    async getMetadata(datasetCode: string): Promise<any> {
        try {
            const url = `${this.config.baseUrl}/data/${datasetCode}`;

            const response = await axios.get(url, {
                params: {
                    format: 'JSON',
                    lang: 'EN',
                },
            });

            // JSON-statのメタデータ部分を返す
            return {
                dimensions: response.data.dimension || {},
                size: response.data.size || [],
                updated: response.data.updated,
                source: response.data.source,
            };
        } catch (error) {
            throw new Error(`Eurostat API error: ${error}`);
        }
    }

    /**
     * 利用可能なデータセット一覧を取得
     * 注: Eurostatには公式のデータセット一覧APIがないため、
     * 主要なデータセットコードを返す
     */
    getCommonDatasets(): string[] {
        return [
            'nama_10_gdp',      // GDP and main components
            'une_rt_m',         // Unemployment rate
            'prc_hicp_midx',    // HICP - inflation rate
            'demo_pjan',        // Population
            'lfsi_emp_a',       // Employment
            'gov_10dd_edpt1',   // Government deficit/surplus
        ];
    }
}
