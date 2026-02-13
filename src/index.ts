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
        const source = sourceConfig as any;
        if (source.enabled) {
            resources.push({
                uri: `stats://${key}/info`,
                name: `${source.name} - 情報`,
                description: source.description,
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

    try {
        // e-Stat
        if (name === 'estat_search_stats' && clients.estat) {
            const result = await clients.estat.getStatsList(args as any);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        if (name === 'estat_get_data' && clients.estat) {
            const result = await clients.estat.getStatsData(args as any);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        // World Bank
        if (name === 'worldbank_get_indicator' && clients.worldbank) {
            const result = await clients.worldbank.getIndicatorData(args as any);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        if (name === 'worldbank_search_indicators' && clients.worldbank) {
            const result = await clients.worldbank.getIndicators(args as any);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        // OECD
        if (name === 'oecd_get_data' && clients.oecd) {
            const result = await clients.oecd.getData(args as any);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        // Eurostat
        if (name === 'eurostat_get_data' && clients.eurostat) {
            const result = await clients.eurostat.getData(args as any);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

// サーバーを起動
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Statistics Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
