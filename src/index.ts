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
    GenerateChartArgs,
    ExportDataArgs,
    CalculateStatisticsArgs,
} from './types.js';
import { ChartService } from './charts/chartService.js';
import { DataExportService } from './services/dataExportService.js';
import { calculateStatistics, calculateGroupedStatistics } from './statistics/basicStats.js';
import { formatWorldBankDataForAnalysis, formatEStatDataForAnalysis } from './utils/dataFormatter.js';

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
    const match = uri.match(/^stats:\/\/([^/]+)\/info$/);

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
                            description: '国コード（例: JP, US, CN。複数国はセミコロン区切り: USA;JPN;CHN）',
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

    // データエクスポートツール
    tools.push({
        name: 'export_data',
        description: '統計データを専門ツールで分析しやすい形式（CSV/JSON）で出力します',
        inputSchema: {
            type: 'object',
            properties: {
                dataSource: {
                    type: 'string',
                    enum: ['worldbank', 'estat'],
                    description: 'データソース',
                },
                dataParams: {
                    type: 'object',
                    description: 'データソース固有のパラメータ',
                    properties: {
                        countryCode: { type: 'string', description: '国コード（World Bank用、例: USA;JPN）' },
                        indicatorCode: { type: 'string', description: '指標コード（World Bank用、例: NY.GDP.MKTP.CD）' },
                        startYear: { type: 'number', description: '開始年（World Bank用）' },
                        endYear: { type: 'number', description: '終了年（World Bank用）' },
                        statsDataId: { type: 'string', description: '統計表ID（e-Stat用）' },
                        limit: { type: 'number', description: '取得件数（e-Stat用）' },
                    },
                },
                format: {
                    type: 'string',
                    enum: ['csv', 'json', 'json-structured'],
                    description: '出力形式（csv: CSV形式, json: JSON配列, json-structured: 構造化JSON）',
                },
                transform: {
                    type: 'object',
                    description: 'データの変換オプション',
                    properties: {
                        asTimeSeries: {
                            type: 'object',
                            description: '時系列形式に変換',
                            properties: {
                                dateColumn: { type: 'string' },
                                valueColumn: { type: 'string' },
                                groupColumn: { type: 'string' },
                            },
                        },
                        asPivot: {
                            type: 'object',
                            description: 'ピボット形式に変換',
                            properties: {
                                indexColumn: { type: 'string' },
                                columnsColumn: { type: 'string' },
                                valuesColumn: { type: 'string' },
                            },
                        },
                        filter: { type: 'object', description: 'フィルタリング条件' },
                        sort: {
                            type: 'array',
                            description: 'ソート条件',
                            items: {
                                type: 'object',
                                properties: {
                                    column: { type: 'string' },
                                    order: { type: 'string', enum: ['asc', 'desc'] },
                                },
                            },
                        },
                    },
                },
            },
            required: ['dataSource', 'dataParams', 'format'],
        },
    });

    // 統計量計算ツール
    tools.push({
        name: 'calculate_statistics',
        description: '統計データから基本的な統計量（平均、中央値、標準偏差など）を計算します',
        inputSchema: {
            type: 'object',
            properties: {
                dataSource: {
                    type: 'string',
                    enum: ['worldbank', 'estat'],
                    description: 'データソース',
                },
                dataParams: {
                    type: 'object',
                    description: 'データソース固有のパラメータ',
                    properties: {
                        countryCode: { type: 'string', description: '国コード（World Bank用、例: USA;JPN）' },
                        indicatorCode: { type: 'string', description: '指標コード（World Bank用、例: NY.GDP.MKTP.CD）' },
                        startYear: { type: 'number', description: '開始年（World Bank用）' },
                        endYear: { type: 'number', description: '終了年（World Bank用）' },
                        statsDataId: { type: 'string', description: '統計表ID（e-Stat用）' },
                        limit: { type: 'number', description: '取得件数（e-Stat用）' },
                    },
                },
                statistics: {
                    type: 'array',
                    description: '計算する統計量',
                    items: {
                        type: 'string',
                        enum: ['mean', 'median', 'mode', 'std', 'variance', 'min', 'max', 'range', 'q1', 'q3', 'iqr'],
                    },
                },
                groupBy: {
                    type: 'string',
                    description: 'グループ化する列（例: country_code, year）',
                },
                valueColumn: {
                    type: 'string',
                    description: '値の列名（デフォルト: value）',
                },
            },
            required: ['dataSource', 'dataParams', 'statistics'],
        },
    });

    // チャート生成ツール
    tools.push({
        name: 'generate_chart',
        description: '統計データからチャートやグラフを生成します（SVG形式）',
        inputSchema: {
            type: 'object',
            properties: {
                chartType: {
                    type: 'string',
                    enum: ['line', 'bar', 'pie'],
                    description: 'チャートタイプ（line: 折れ線グラフ, bar: 棒グラフ, pie: 円グラフ）',
                },
                dataSource: {
                    type: 'string',
                    enum: ['worldbank', 'estat'],
                    description: 'データソース',
                },
                dataParams: {
                    type: 'object',
                    description: 'データソース固有のパラメータ',
                    properties: {
                        countryCode: { type: 'string', description: '国コード（World Bank用、例: USA;JPN）' },
                        indicatorCode: { type: 'string', description: '指標コード（World Bank用、例: NY.GDP.MKTP.CD）' },
                        startYear: { type: 'number', description: '開始年（World Bank用）' },
                        endYear: { type: 'number', description: '終了年（World Bank用）' },
                        statsDataId: { type: 'string', description: '統計表ID（e-Stat用）' },
                        limit: { type: 'number', description: '取得件数（e-Stat用）' },
                    },
                },
                title: {
                    type: 'string',
                    description: 'チャートタイトル',
                },
                xLabel: {
                    type: 'string',
                    description: 'X軸ラベル',
                },
                yLabel: {
                    type: 'string',
                    description: 'Y軸ラベル',
                },
                width: {
                    type: 'number',
                    description: 'チャート幅（デフォルト: 800）',
                },
                height: {
                    type: 'number',
                    description: 'チャート高さ（デフォルト: 400）',
                },
            },
            required: ['chartType', 'dataSource', 'dataParams'],
        },
    });

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
        }
        // データエクスポート
        else if (toolName === 'export_data') {
            const exportService = new DataExportService(clients.worldbank, clients.estat);
            result = await exportService.exportData(validatedArgs as ExportDataArgs);
        }
        // 統計量計算
        else if (toolName === 'calculate_statistics') {
            const statsArgs = validatedArgs as CalculateStatisticsArgs;
            
            // データを取得
            let rawData: any;
            if (statsArgs.dataSource === 'worldbank' && clients.worldbank) {
                const { countryCode, indicatorCode, startYear, endYear } = statsArgs.dataParams;
                rawData = await clients.worldbank.getIndicatorData({
                    countryCode: countryCode!,
                    indicatorCode: indicatorCode!,
                    startYear,
                    endYear,
                });
            } else if (statsArgs.dataSource === 'estat' && clients.estat) {
                const { statsDataId, limit } = statsArgs.dataParams;
                rawData = await clients.estat.getStatsData({
                    statsDataId: statsDataId!,
                    limit: limit || 10000,
                });
            } else {
                throw new Error(`Data source not available: ${statsArgs.dataSource}`);
            }
            
            // データを整形
            const formattedData = statsArgs.dataSource === 'worldbank'
                ? formatWorldBankDataForAnalysis(rawData)
                : formatEStatDataForAnalysis(rawData);
            
            // 値の列を取得
            const valueColumn = statsArgs.valueColumn || 'value';
            
            // グループ化する場合
            if (statsArgs.groupBy) {
                const groupedStats = calculateGroupedStatistics(
                    formattedData,
                    statsArgs.groupBy,
                    valueColumn,
                    statsArgs.statistics
                );
                result = {
                    statistics: groupedStats,
                    grouped: true,
                    groupBy: statsArgs.groupBy,
                };
            } else {
                // 全体の統計量を計算
                const values = formattedData
                    .map(row => Number(row[valueColumn]))
                    .filter(v => !isNaN(v));
                
                const stats = calculateStatistics(values, statsArgs.statistics);
                result = {
                    statistics: stats,
                    grouped: false,
                    dataPoints: values.length,
                };
            }
        }
        // チャート生成
        else if (toolName === 'generate_chart') {
            const chartService = new ChartService(clients.worldbank, clients.estat);
            const svg = await chartService.generateChart(validatedArgs as GenerateChartArgs);
            // SVGをBase64エンコードして返す（MCPのimageタイプとして返すことも可能）
            const base64Svg = Buffer.from(svg).toString('base64');
            result = {
                svg: svg,
                dataUri: `data:image/svg+xml;base64,${base64Svg}`,
                format: 'svg',
            };
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
