import axios from 'axios';
import { createApiErrorFromAxiosError } from '../errors.js';
import { withRetry } from '../retry.js';
import { getRateLimiter } from '../rateLimiter.js';

export interface EStatConfig {
    baseUrl: string;
    apiKey: string;
}

export interface StatsList {
    statsCode: string;
    title: string;
    surveyDate: string;
}

/**
 * e-Stat APIクライアント
 */
export class EStatClient {
    private config: EStatConfig;
    private readonly sourceName = 'e-Stat';

    constructor(config: EStatConfig) {
        this.config = config;
    }

    /**
     * 統計表情報を取得
     * @param params - 検索パラメータ
     * @returns 統計表のリスト
     */
    async getStatsList(params: {
        searchWord?: string;
        limit?: number;
    }): Promise<StatsList[]> {
        const rateLimiter = getRateLimiter('estat');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/app/json/getStatsList`, {
                    params: {
                        appId: this.config.apiKey,
                        searchWord: params.searchWord || '',
                        limit: params.limit || 10,
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                const result = response.data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF;
                
                if (result === undefined || result === null) {
                    return [];
                }

                return Array.isArray(result) ? result : [result];
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * 統計データを取得
     * @param params - データ取得パラメータ
     * @returns 統計データ
     */
    async getStatsData(params: {
        statsDataId: string;
        limit?: number;
    }): Promise<any> {
        const rateLimiter = getRateLimiter('estat');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/app/json/getStatsData`, {
                    params: {
                        appId: this.config.apiKey,
                        statsDataId: params.statsDataId,
                        limit: params.limit || 100,
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                const data = response.data?.GET_STATS_DATA?.STATISTICAL_DATA;
                
                if (data === undefined || data === null) {
                    throw new Error('Statistical data not found in response');
                }

                return data;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * メタ情報を取得
     * @param params - メタ情報取得パラメータ
     * @returns メタ情報
     */
    async getMetaInfo(params: { statsDataId: string }): Promise<any> {
        const rateLimiter = getRateLimiter('estat');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/app/json/getMetaInfo`, {
                    params: {
                        appId: this.config.apiKey,
                        statsDataId: params.statsDataId,
                    },
                });

                // レスポンスの検証
                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response format: expected object');
                }

                const metadata = response.data?.GET_META_INFO?.METADATA_INF;
                
                if (metadata === undefined || metadata === null) {
                    throw new Error('Metadata not found in response');
                }

                return metadata;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }
}
