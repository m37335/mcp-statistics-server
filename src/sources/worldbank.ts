import axios from 'axios';
import { createApiErrorFromAxiosError } from '../errors.js';
import { withRetry } from '../retry.js';
import { getRateLimiter } from '../rateLimiter.js';

export interface WorldBankConfig {
    baseUrl: string;
}

export interface Indicator {
    id: string;
    name: string;
    sourceNote: string;
}

/**
 * World Bank APIクライアント
 */
export class WorldBankClient {
    private config: WorldBankConfig;
    private readonly sourceName = 'World Bank';

    constructor(config: WorldBankConfig) {
        this.config = config;
    }

    /**
     * 指標データを取得
     * @param params - 指標データ取得パラメータ
     * @returns 指標データの配列
     */
    async getIndicatorData(params: {
        countryCode: string;
        indicatorCode: string;
        startYear?: number;
        endYear?: number;
    }): Promise<any[]> {
        const rateLimiter = getRateLimiter('worldbank');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const url = `${this.config.baseUrl}/country/${params.countryCode}/indicator/${params.indicatorCode}`;
                const response = await axios.get(url, {
                    params: {
                        format: 'json',
                        date: params.startYear && params.endYear
                            ? `${params.startYear}:${params.endYear}`
                            : undefined,
                        per_page: 1000,
                    },
                });

                // レスポンスの検証
                if (!Array.isArray(response.data)) {
                    throw new Error('Invalid response format: expected array');
                }

                // World Bank APIは [metadata, data] の配列を返す
                const data = response.data[1];
                
                // データが存在しない場合、空配列を返す（エラーではなく正常な動作）
                if (!data || !Array.isArray(data)) {
                    return [];
                }
                
                return data;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * 指標リストを取得
     * @param params - 検索パラメータ
     * @returns 指標のリスト
     */
    async getIndicators(params: { search?: string }): Promise<Indicator[]> {
        const rateLimiter = getRateLimiter('worldbank');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/indicator`, {
                    params: {
                        format: 'json',
                        per_page: 500, // より多くの指標を取得
                    },
                });

                // レスポンスの検証
                if (!Array.isArray(response.data)) {
                    throw new Error('Invalid response format: expected array');
                }

                const indicators = response.data[1] || [];

                if (!Array.isArray(indicators)) {
                    return [];
                }

                let result = indicators as Indicator[];

                if (params.search) {
                    const searchLower = params.search.toLowerCase();
                    result = result.filter((ind: Indicator) =>
                        ind.name?.toLowerCase().includes(searchLower) ||
                        ind.id?.toLowerCase().includes(searchLower)
                    );
                }

                return result;
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }

    /**
     * 国リストを取得
     * @returns 国のリスト
     */
    async getCountries(): Promise<any[]> {
        const rateLimiter = getRateLimiter('worldbank');
        await rateLimiter.waitForAvailability();
        
        return withRetry(async () => {
            try {
                const response = await axios.get(`${this.config.baseUrl}/country`, {
                    params: {
                        format: 'json',
                        per_page: 500,
                    },
                });

                // レスポンスの検証
                if (!Array.isArray(response.data)) {
                    throw new Error('Invalid response format: expected array');
                }

                const countries = response.data[1];
                return Array.isArray(countries) ? countries : [];
            } catch (error) {
                throw createApiErrorFromAxiosError(this.sourceName, error);
            }
        });
    }
}
