import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DataSourceConfig {
    name: string;
    baseUrl: string;
    apiKey: string | null;
    enabled: boolean;
    description: string;
    license: string;
}

export interface ServerConfig {
    name: string;
    version: string;
}

export interface Config {
    dataSources: {
        estat: DataSourceConfig;
        worldbank: DataSourceConfig;
        oecd: DataSourceConfig;
        eurostat: DataSourceConfig;
    };
    server: ServerConfig;
}

/**
 * 環境変数から設定を読み込む
 * 環境変数が設定されていない場合はundefinedを返す
 */
function getEnvConfig(): Partial<Config> {
    const envConfig: any = {
        dataSources: {},
        server: {},
    };

    // e-Stat
    if (process.env.ESTAT_API_KEY || process.env.ESTAT_BASE_URL || process.env.ESTAT_ENABLED !== undefined) {
        envConfig.dataSources.estat = {
            apiKey: process.env.ESTAT_API_KEY,
            baseUrl: process.env.ESTAT_BASE_URL,
            enabled: process.env.ESTAT_ENABLED === 'true',
        };
    }

    // World Bank
    if (process.env.WORLDBANK_BASE_URL || process.env.WORLDBANK_ENABLED !== undefined) {
        envConfig.dataSources.worldbank = {
            baseUrl: process.env.WORLDBANK_BASE_URL,
            enabled: process.env.WORLDBANK_ENABLED === 'true',
        };
    }

    // OECD
    if (process.env.OECD_BASE_URL || process.env.OECD_ENABLED !== undefined) {
        envConfig.dataSources.oecd = {
            baseUrl: process.env.OECD_BASE_URL,
            enabled: process.env.OECD_ENABLED === 'true',
        };
    }

    // Eurostat
    if (process.env.EUROSTAT_BASE_URL || process.env.EUROSTAT_ENABLED !== undefined) {
        envConfig.dataSources.eurostat = {
            baseUrl: process.env.EUROSTAT_BASE_URL,
            enabled: process.env.EUROSTAT_ENABLED === 'true',
        };
    }

    // Server
    if (process.env.SERVER_NAME || process.env.SERVER_VERSION) {
        envConfig.server = {
            name: process.env.SERVER_NAME,
            version: process.env.SERVER_VERSION,
        };
    }

    return envConfig;
}

/**
 * 2つの設定オブジェクトをマージする
 * envConfigが優先される
 */
function mergeConfig(fileConfig: any, envConfig: any): any {
    const merged = JSON.parse(JSON.stringify(fileConfig)); // Deep copy

    // データソースのマージ
    if (envConfig.dataSources) {
        for (const [key, value] of Object.entries(envConfig.dataSources)) {
            if (merged.dataSources[key] && value) {
                merged.dataSources[key] = {
                    ...merged.dataSources[key],
                    ...value,
                };
            }
        }
    }

    // サーバー設定のマージ
    if (envConfig.server) {
        merged.server = {
            ...merged.server,
            ...envConfig.server,
        };
    }

    return merged;
}

/**
 * 設定を読み込む
 * 優先順位: 環境変数 > config.json > デフォルト値
 */
export async function loadConfig(): Promise<Config> {
    // config.jsonを読み込み
    const configPath = join(__dirname, '../config.json');
    let fileConfig: any;

    try {
        const configData = await readFile(configPath, 'utf-8');
        fileConfig = JSON.parse(configData);
    } catch (error) {
        console.error('Warning: Could not read config.json, using environment variables only');
        fileConfig = {
            dataSources: {
                estat: { enabled: false },
                worldbank: { enabled: false },
                oecd: { enabled: false },
                eurostat: { enabled: false },
            },
            server: {},
        };
    }

    // 環境変数から設定を読み込み
    const envConfig = getEnvConfig();

    // マージ
    const config = mergeConfig(fileConfig, envConfig);

    // 必須設定の検証
    validateConfig(config);

    return config;
}

/**
 * 設定の妥当性を検証
 */
function validateConfig(config: Config): void {
    // e-Statが有効な場合、APIキーが必須
    if (config.dataSources.estat.enabled) {
        if (!config.dataSources.estat.apiKey || config.dataSources.estat.apiKey === 'YOUR_ESTAT_API_KEY') {
            throw new Error(
                'e-Stat is enabled but API key is not configured. ' +
                'Please set ESTAT_API_KEY environment variable or update config.json'
            );
        }
    }

    // 各データソースのベースURLが設定されているか確認
    for (const [key, source] of Object.entries(config.dataSources)) {
        if (source.enabled && !source.baseUrl) {
            throw new Error(`${key} is enabled but baseUrl is not configured`);
        }
    }

    // サーバー設定の確認
    if (!config.server.name || !config.server.version) {
        throw new Error('Server name and version must be configured');
    }
}
