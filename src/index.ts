#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig } from './config.js';
import { EStatClient } from './sources/estat.js';
import { WorldBankClient } from './sources/worldbank.js';
import { OECDClient } from './sources/oecd.js';
import { EurostatClient } from './sources/eurostat.js';
import { getValidator, ValidationError } from './validation.js';
import { ApiError, formatErrorForUser } from './errors.js';
import { defaultLogger } from './logger.js';
import type {
    ToolName,
    EStatSearchStatsArgs,
    EStatGetDataArgs,
    WorldBankGetIndicatorArgs,
    WorldBankSearchIndicatorsArgs,
    OECDGetDataArgs,
    EurostatGetDataArgs,
} from './types.js';

// 設定を読み込み（環境変数 > config.json）
const config = await loadConfig();

// データソースクライアントを初期化
const clients = {
    estat: config.dataSources.estat.enabled
        ? new EStatClient({
            baseUrl: config.dataSources.estat.baseUrl,
            apiKey: config.dataSources.estat.apiKey!,
        })
        : null,
    worldbank: config.dataSources.worldbank.enabled
        ? new WorldBankClient({
            baseUrl: config.dataSources.worldbank.baseUrl,
        })
        : null,
    oecd: config.dataSources.oecd.enabled
        ? new OECDClient({
            baseUrl: config.dataSources.oecd.baseUrl,
        })
        : null,
    eurostat: config.dataSources.eurostat.enabled
        ? new EurostatClient({
            baseUrl: config.dataSources.eurostat.baseUrl,
        })
        : null,
};

// MCPサーバーを作成
const server = new Server(
    {
        name: config.server.name,
        version: config.server.version,
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

// リソース一覧を返す
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = [];

    // 各データソースの情報をリソースとして公開
    for (const [key, sourceConfig] of Object.entries(config.dataSources)) {
        if (sourceConfig.enabled) {
            resources.push({
                uri: `stats://${key}/info`,
                name: `${sourceConfig.name} - 情報`,
                description: sourceConfig.description,
                mimeType: 'application/json',
            });
        }
    }

    return { resources };
});

// リソースの内容を返す
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^stats:\/\/([^\/]+)\/info$/);

    if (!match) {
        throw new Error(`Unknown resource: ${uri}`);
    }

    const sourceKey = match[1] as keyof typeof config.dataSources;
    const sourceConfig = config.dataSources[sourceKey];

    if (!sourceConfig || !sourceConfig.enabled) {
        throw new Error(`Data source not available: ${sourceKey}`);
    }

    return {
        contents: [
            {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                    {
                        name: sourceConfig.name,
                        description: sourceConfig.description,
                        license: sourceConfig.license,
                        baseUrl: sourceConfig.baseUrl,
                    },
                    null,
                    2
                ),
            },
        ],
    };
});

// ツール一覧を返す
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [];

    // e-Stat
    if (clients.estat) {
        tools.push(
            {
                name: 'estat_search_stats',
                description: 'e-Statで統計表を検索します',
                inputSchema: {
                    type: 'object',
                    properties: {
                        searchWord: {
                            type: 'string',
                            description: '検索キーワード',
                        },
                        limit: {
                            type: 'number',
                            description: '取得件数（デフォルト: 10）',
                        },
                    },
                },
            },
            {
                name: 'estat_get_data',
                description: 'e-Statから統計データを取得します',
                inputSchema: {
                    type: 'object',
                    properties: {
                        statsDataId: {
                            type: 'string',
                            description: '統計表ID',
                        },
                        limit: {
                            type: 'number',
                            description: '取得件数（デフォルト: 100）',
                        },
                    },
                    required: ['statsDataId'],
                },
            }
        );
    }

    // World Bank
    if (clients.worldbank) {
        tools.push(
            {
                name: 'worldbank_get_indicator',
                description: 'World Bankの指標データを取得します',
                inputSchema: {
                    type: 'object',
                    properties: {
                        countryCode: {
                            type: 'string',
                            description: '国コード（例: JP, US, CN）',
                        },
                        indicatorCode: {
                            type: 'string',
                            description: '指標コード（例: NY.GDP.MKTP.CD）',
                        },
                        startYear: {
                            type: 'number',
                            description: '開始年',
                        },
                        endYear: {
                            type: 'number',
                            description: '終了年',
                        },
                    },
                    required: ['countryCode', 'indicatorCode'],
                },
            },
            {
                name: 'worldbank_search_indicators',
                description: 'World Bankの指標を検索します',
                inputSchema: {
                    type: 'object',
                    properties: {
                        search: {
                            type: 'string',
                            description: '検索キーワード',
                        },
                    },
                },
            }
        );
    }

    // OECD
    if (clients.oecd) {
        tools.push({
            name: 'oecd_get_data',
            description: 'OECDのデータを取得します（SDMX形式）',
            inputSchema: {
                type: 'object',
                properties: {
                    datasetId: {
                        type: 'string',
                        description: 'データセットID（例: QNA）',
                    },
                    filter: {
                        type: 'string',
                        description: 'フィルター（例: JPN.GDP.....）',
                    },
                    startPeriod: {
                        type: 'string',
                        description: '開始期間（例: 2020-Q1）',
                    },
                    endPeriod: {
                        type: 'string',
                        description: '終了期間（例: 2024-Q4）',
                    },
                },
                required: ['datasetId'],
            },
        });
    }

    // Eurostat
    if (clients.eurostat) {
        tools.push({
            name: 'eurostat_get_data',
            description: 'Eurostatのデータを取得します（JSON-stat形式）',
            inputSchema: {
                type: 'object',
                properties: {
                    datasetCode: {
                        type: 'string',
                        description: 'データセットコード（例: nama_10_gdp）',
                    },
                    filters: {
                        type: 'object',
                        description: 'フィルター（例: {"geo": "EU27_2020", "time": "2023"}）',
                    },
                    lang: {
                        type: 'string',
                        description: '言語（EN, DE, FR等、デフォルト: EN）',
                    },
                },
                required: ['datasetCode'],
            },
        });
    }

    return { tools };
});

// ツールを実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();

    try {
        // ツール名の検証
        const toolName = name as ToolName;
        
        // リクエストログ
        defaultLogger.logRequest(toolName, args);
        
        // 引数のバリデーション
        const validator = getValidator(toolName);
        const validatedArgs = validator(args);

        let result: unknown;

        // e-Stat
        if (toolName === 'estat_search_stats' && clients.estat) {
            result = await clients.estat.getStatsList(validatedArgs as EStatSearchStatsArgs);
        } else if (toolName === 'estat_get_data' && clients.estat) {
            result = await clients.estat.getStatsData(validatedArgs as EStatGetDataArgs);
        }
        // World Bank
        else if (toolName === 'worldbank_get_indicator' && clients.worldbank) {
            result = await clients.worldbank.getIndicatorData(validatedArgs as WorldBankGetIndicatorArgs);
        } else if (toolName === 'worldbank_search_indicators' && clients.worldbank) {
            result = await clients.worldbank.getIndicators(validatedArgs as WorldBankSearchIndicatorsArgs);
        }
        // OECD
        else if (toolName === 'oecd_get_data' && clients.oecd) {
            result = await clients.oecd.getData(validatedArgs as OECDGetDataArgs);
        }
        // Eurostat
        else if (toolName === 'eurostat_get_data' && clients.eurostat) {
            result = await clients.eurostat.getData(validatedArgs as EurostatGetDataArgs);
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }

        const duration = Date.now() - startTime;
        defaultLogger.logResponse(toolName, true, duration);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        const toolName = name as ToolName;
        
        // エラーログ
        if (error instanceof Error) {
            defaultLogger.error(`Tool execution failed: ${toolName}`, error, {
                tool: toolName,
                duration,
            });
        } else {
            defaultLogger.error(`Tool execution failed: ${toolName}`, undefined, {
                tool: toolName,
                duration,
                error: String(error),
            });
        }

        defaultLogger.logResponse(toolName, false, duration);

        // バリデーションエラーの場合
        if (error instanceof ValidationError) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'ValidationError',
                            message: error.message,
                            field: error.field,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }

        // APIエラーの場合
        if (error instanceof ApiError) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'ApiError',
                            source: error.source,
                            message: error.message,
                            details: error.details,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }

        // その他のエラー
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Error',
                        message: formatErrorForUser(error),
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});

// サーバーを起動
async function main() {
    try {
        defaultLogger.info('Starting MCP Statistics Server', {
            name: config.server.name,
            version: config.server.version,
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);
        
        defaultLogger.info('MCP Statistics Server running on stdio');
    } catch (error) {
        defaultLogger.error('Failed to start server', error instanceof Error ? error : undefined);
        process.exit(1);
    }
}

main().catch((error) => {
    defaultLogger.error('Unhandled server error', error instanceof Error ? error : undefined);
    process.exit(1);
});
