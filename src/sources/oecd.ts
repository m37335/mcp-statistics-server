import axios from 'axios';
import { createApiErrorFromAxiosError } from '../errors.js';
import { withRetry } from '../retry.js';
import { getRateLimiter } from '../rateLimiter.js';

export interface OECDConfig {
    baseUrl: string;
}

/**
 * OECD APIクライアント
 */
export class OECDClient {
    private config: OECDConfig;
    private readonly sourceName = 'OECD';

    constructor(config: OECDConfig) {
        this.config = config;
    }

    /**
     * SDMX-JSONデータを取得
     * @param params - データ取得パラメータ
     * @returns SDMX-JSON形式のデータ
     */
    async getData(params: {
        datasetId: string;
        filter?: string;
        startPeriod?: string;
        endPeriod?: string;
    }): Promise<any> {
        const rateLimiter = getRateLimiter('oecd');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const filterPart = params.filter || 'all';
                const url = `${this.config.baseUrl}/data/${params.datasetId}/${filterPart}`;

                const response = await axios.get(url, {
                    params: {
                        startPeriod: params.startPeriod,
                        endPeriod: params.endPeriod,
                        dimensionAtObservation: 'AllDimensions',
                    },
                    headers: {
                        'Accept': 'application/vnd.sdmx.data+json;version=1.0.0-wd',
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                return response.data;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * データセット一覧を取得
     * @returns データセット一覧
     */
    async getDatasets(): Promise<any> {
        const rateLimiter = getRateLimiter('oecd');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/dataflow/OECD/all`, {
                    headers: {
                        'Accept': 'application/vnd.sdmx.structure+json;version=1.0.0',
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                return response.data;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * データ構造定義（DSD）を取得
     * @param datasetId - データセットID
     * @returns データ構造定義
     */
    async getDataStructure(datasetId: string): Promise<any> {
        const rateLimiter = getRateLimiter('oecd');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/datastructure/OECD/${datasetId}`, {
                    headers: {
                        'Accept': 'application/vnd.sdmx.structure+json;version=1.0.0',
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                return response.data;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }
}
