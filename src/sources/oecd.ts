import axios from 'axios';

export interface OECDConfig {
    baseUrl: string;
}

export class OECDClient {
    private config: OECDConfig;

    constructor(config: OECDConfig) {
        this.config = config;
    }

    /**
     * SDMX-JSONデータを取得
     */
    async getData(params: {
        datasetId: string;
        filter?: string;
        startPeriod?: string;
        endPeriod?: string;
    }): Promise<any> {
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

            return response.data;
        } catch (error) {
            throw new Error(`OECD API error: ${error}`);
        }
    }

    /**
     * データセット一覧を取得
     */
    async getDatasets(): Promise<any> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/dataflow/OECD/all`, {
                headers: {
                    'Accept': 'application/vnd.sdmx.structure+json;version=1.0.0',
                },
            });

            return response.data;
        } catch (error) {
            throw new Error(`OECD API error: ${error}`);
        }
    }

    /**
     * データ構造定義（DSD）を取得
     */
    async getDataStructure(datasetId: string): Promise<any> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/datastructure/OECD/${datasetId}`, {
                headers: {
                    'Accept': 'application/vnd.sdmx.structure+json;version=1.0.0',
                },
            });

            return response.data;
        } catch (error) {
            throw new Error(`OECD API error: ${error}`);
        }
    }
}
