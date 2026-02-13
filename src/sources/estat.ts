import axios from 'axios';

export interface EStatConfig {
    baseUrl: string;
    apiKey: string;
}

export interface StatsList {
    statsCode: string;
    title: string;
    surveyDate: string;
}

export class EStatClient {
    private config: EStatConfig;

    constructor(config: EStatConfig) {
        this.config = config;
    }

    /**
     * 統計表情報を取得
     */
    async getStatsList(params: {
        searchWord?: string;
        limit?: number;
    }): Promise<StatsList[]> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/app/json/getStatsList`, {
                params: {
                    appId: this.config.apiKey,
                    searchWord: params.searchWord || '',
                    limit: params.limit || 10,
                },
            });

            const result = response.data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
            return Array.isArray(result) ? result : [result];
        } catch (error) {
            throw new Error(`e-Stat API error: ${error}`);
        }
    }

    /**
     * 統計データを取得
     */
    async getStatsData(params: {
        statsDataId: string;
        limit?: number;
    }): Promise<any> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/app/json/getStatsData`, {
                params: {
                    appId: this.config.apiKey,
                    statsDataId: params.statsDataId,
                    limit: params.limit || 100,
                },
            });

            return response.data?.GET_STATS_DATA?.STATISTICAL_DATA || {};
        } catch (error) {
            throw new Error(`e-Stat API error: ${error}`);
        }
    }

    /**
     * メタ情報を取得
     */
    async getMetaInfo(params: { statsDataId: string }): Promise<any> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/app/json/getMetaInfo`, {
                params: {
                    appId: this.config.apiKey,
                    statsDataId: params.statsDataId,
                },
            });

            return response.data?.GET_META_INFO?.METADATA_INF || {};
        } catch (error) {
            throw new Error(`e-Stat API error: ${error}`);
        }
    }
}
