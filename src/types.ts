/**
 * MCPツールの引数型定義
 */

/**
 * e-Stat統計表検索の引数
 */
export interface EStatSearchStatsArgs {
    /** 検索キーワード */
    searchWord?: string;
    /** 取得件数（デフォルト: 10、最大: 1000） */
    limit?: number;
}

/**
 * e-Stat統計データ取得の引数
 */
export interface EStatGetDataArgs {
    /** 統計表ID（必須） */
    statsDataId: string;
    /** 取得件数（デフォルト: 100、最大: 10000） */
    limit?: number;
}

/**
 * World Bank指標データ取得の引数
 */
export interface WorldBankGetIndicatorArgs {
    /** 国コード（必須、例: JP, US, CN。複数国はセミコロン区切り: USA;JPN） */
    countryCode: string;
    /** 指標コード（必須、例: NY.GDP.MKTP.CD） */
    indicatorCode: string;
    /** 開始年（オプション、1960-2100） */
    startYear?: number;
    /** 終了年（オプション、1960-2100） */
    endYear?: number;
}

/**
 * World Bank指標検索の引数
 */
export interface WorldBankSearchIndicatorsArgs {
    /** 検索キーワード（オプション） */
    search?: string;
}

/**
 * OECDデータ取得の引数
 */
export interface OECDGetDataArgs {
    /** データセットID（必須、例: QNA） */
    datasetId: string;
    /** フィルター（オプション、例: JPN.GDP.....） */
    filter?: string;
    /** 開始期間（オプション、例: 2020-Q1） */
    startPeriod?: string;
    /** 終了期間（オプション、例: 2024-Q4） */
    endPeriod?: string;
}

/**
 * Eurostatデータ取得の引数
 */
export interface EurostatGetDataArgs {
    /** データセットコード（必須、例: nama_10_gdp） */
    datasetCode: string;
    /** フィルター（オプション、例: {"geo": "EU27_2020", "time": "2023"}） */
    filters?: Record<string, string>;
    /** 言語（オプション、EN, DE, FR等、デフォルト: EN） */
    lang?: string;
}

/**
 * チャート生成の引数
 */
export interface GenerateChartArgs {
    /** チャートタイプ（line, bar, pie） */
    chartType: 'line' | 'bar' | 'pie';
    /** データソース（worldbank, estat等） */
    dataSource: 'worldbank' | 'estat';
    /** データソース固有のパラメータ */
    dataParams: {
        // World Bank用
        countryCode?: string;
        indicatorCode?: string;
        startYear?: number;
        endYear?: number;
        // e-Stat用
        statsDataId?: string;
        limit?: number;
    };
    /** チャートタイトル */
    title?: string;
    /** X軸ラベル */
    xLabel?: string;
    /** Y軸ラベル */
    yLabel?: string;
    /** チャート幅（デフォルト: 800） */
    width?: number;
    /** チャート高さ（デフォルト: 400） */
    height?: number;
}

/**
 * データ出力の引数（専門ツール用）
 */
export interface ExportDataArgs {
    /** データソース（worldbank, estat等） */
    dataSource: 'worldbank' | 'estat';
    /** データソース固有のパラメータ */
    dataParams: {
        // World Bank用
        countryCode?: string;
        indicatorCode?: string;
        startYear?: number;
        endYear?: number;
        // e-Stat用
        statsDataId?: string;
        limit?: number;
    };
    /** 出力形式（csv, json, json-structured） */
    format: 'csv' | 'json' | 'json-structured';
    /** データの整形オプション */
    transform?: {
        /** 時系列形式に変換 */
        asTimeSeries?: {
            dateColumn: string;
            valueColumn: string;
            groupColumn?: string;
        };
        /** ピボット形式に変換 */
        asPivot?: {
            indexColumn: string;
            columnsColumn: string;
            valuesColumn: string;
        };
        /** フィルタリング条件 */
        filter?: Record<string, unknown>;
        /** ソート条件 */
        sort?: Array<{ column: string; order: 'asc' | 'desc' }>;
    };
}

/**
 * 基本的な統計量計算の引数
 */
export interface CalculateStatisticsArgs {
    /** データソース（worldbank, estat等） */
    dataSource: 'worldbank' | 'estat';
    /** データソース固有のパラメータ */
    dataParams: {
        countryCode?: string;
        indicatorCode?: string;
        startYear?: number;
        endYear?: number;
        statsDataId?: string;
        limit?: number;
    };
    /** 計算する統計量 */
    statistics: Array<'mean' | 'median' | 'mode' | 'std' | 'variance' | 'min' | 'max' | 'range' | 'q1' | 'q3' | 'iqr'>;
    /** グループ化する列（オプション） */
    groupBy?: string;
    /** 値の列名（オプション、デフォルト: 'value'） */
    valueColumn?: string;
}

/**
 * ツール名と引数の型マッピング
 */
export type ToolArgsMap = {
    estat_search_stats: EStatSearchStatsArgs;
    estat_get_data: EStatGetDataArgs;
    worldbank_get_indicator: WorldBankGetIndicatorArgs;
    worldbank_search_indicators: WorldBankSearchIndicatorsArgs;
    oecd_get_data: OECDGetDataArgs;
    eurostat_get_data: EurostatGetDataArgs;
    generate_chart: GenerateChartArgs;
    export_data: ExportDataArgs;
    calculate_statistics: CalculateStatisticsArgs;
};

/**
 * ツール名の型
 */
export type ToolName = keyof ToolArgsMap;
