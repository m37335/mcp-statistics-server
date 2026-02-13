import axios from 'axios';
import { createApiErrorFromAxiosError } from '../errors.js';
import { withRetry } from '../retry.js';
import { getRateLimiter } from '../rateLimiter.js';

export interface EurostatConfig {
    baseUrl: string;
}

/**
 * Eurostat APIクライアント
 */
export class EurostatClient {
    private config: EurostatConfig;
    private readonly sourceName = 'Eurostat';

    constructor(config: EurostatConfig) {
        this.config = config;
    }

    /**
     * 統計データを取得（JSON-stat形式）
     * @param params - データ取得パラメータ
     * @returns JSON-stat形式のデータ
     */
    async getData(params: {
        datasetCode: string;
        filters?: Record<string, string>;
        lang?: string;
    }): Promise<any> {
        const rateLimiter = getRateLimiter('eurostat');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
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

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                // JSON-stat形式の基本的な構造を確認
                if (!('dataset' in response.data) && !('dimension' in response.data)) {
                    throw new Error('Invalid JSON-stat format: missing required fields');
                }

                return response.data;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * データセットのメタデータを取得
     * @param datasetCode - データセットコード
     * @returns メタデータ
     */
    async getMetadata(datasetCode: string): Promise<any> {
        const rateLimiter = getRateLimiter('eurostat');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const url = `${this.config.baseUrl}/data/${datasetCode}`;

                const response = await axios.get(url, {
                    params: {
                        format: 'JSON',
                        lang: 'EN',
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                // JSON-statのメタデータ部分を返す
                return {
                    dimensions: response.data.dimension || {},
                    size: response.data.size || [],
                    updated: response.data.updated,
                    source: response.data.source,
                };
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * 利用可能なデータセット一覧を取得
     * 注: Eurostatには公式のデータセット一覧APIがないため、
     * 主要なデータセットコードを返す
     * @returns 主要なデータセットコードのリスト
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
