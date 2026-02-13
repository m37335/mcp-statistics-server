import axios from 'axios';

export interface WorldBankConfig {
    baseUrl: string;
}

export interface Indicator {
    id: string;
    name: string;
    sourceNote: string;
}

export class WorldBankClient {
    private config: WorldBankConfig;

    constructor(config: WorldBankConfig) {
        this.config = config;
    }

    /**
     * 指標データを取得
     */
    async getIndicatorData(params: {
        countryCode: string;
        indicatorCode: string;
        startYear?: number;
        endYear?: number;
    }): Promise<any[]> {
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

            // World Bank APIは [metadata, data] の配列を返す
            return response.data[1] || [];
        } catch (error) {
            throw new Error(`World Bank API error: ${error}`);
        }
    }

    /**
     * 指標リストを取得
     */
    async getIndicators(params: { search?: string }): Promise<Indicator[]> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/indicator`, {
                params: {
                    format: 'json',
                    per_page: 50,
                },
            });

            const indicators = response.data[1] || [];

            if (params.search) {
                const searchLower = params.search.toLowerCase();
                return indicators.filter((ind: Indicator) =>
                    ind.name.toLowerCase().includes(searchLower) ||
                    ind.id.toLowerCase().includes(searchLower)
                );
            }

            return indicators;
        } catch (error) {
            throw new Error(`World Bank API error: ${error}`);
        }
    }

    /**
     * 国リストを取得
     */
    async getCountries(): Promise<any[]> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/country`, {
                params: {
                    format: 'json',
                    per_page: 500,
                },
            });

            return response.data[1] || [];
        } catch (error) {
            throw new Error(`World Bank API error: ${error}`);
        }
    }
}
