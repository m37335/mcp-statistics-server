import {
    EStatSearchStatsArgs,
    EStatGetDataArgs,
    WorldBankGetIndicatorArgs,
    WorldBankSearchIndicatorsArgs,
    OECDGetDataArgs,
    EurostatGetDataArgs,
    ToolName,
} from './types.js';

/**
 * バリデーションエラー
 */
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * e-Stat検索の引数を検証
 */
export function validateEStatSearchStatsArgs(args: unknown): EStatSearchStatsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new ValidationError('引数はオブジェクトである必要があります');
    }

    const obj = args as Record<string, unknown>;

    if ('limit' in obj && obj.limit !== undefined) {
        if (typeof obj.limit !== 'number' || obj.limit < 1 || obj.limit > 1000) {
            throw new ValidationError('limitは1から1000の数値である必要があります', 'limit');
        }
    }

    if ('searchWord' in obj && obj.searchWord !== undefined) {
        if (typeof obj.searchWord !== 'string') {
            throw new ValidationError('searchWordは文字列である必要があります', 'searchWord');
        }
    }

    return {
        searchWord: obj.searchWord as string | undefined,
        limit: obj.limit as number | undefined,
    };
}

/**
 * e-Statデータ取得の引数を検証
 */
export function validateEStatGetDataArgs(args: unknown): EStatGetDataArgs {
    if (typeof args !== 'object' || args === null) {
        throw new ValidationError('引数はオブジェクトである必要があります');
    }

    const obj = args as Record<string, unknown>;

    if (!obj.statsDataId || typeof obj.statsDataId !== 'string') {
        throw new ValidationError('statsDataIdは必須の文字列です', 'statsDataId');
    }

    if (obj.statsDataId.trim().length === 0) {
        throw new ValidationError('statsDataIdは空文字列にできません', 'statsDataId');
    }

    if ('limit' in obj && obj.limit !== undefined) {
        if (typeof obj.limit !== 'number' || obj.limit < 1 || obj.limit > 10000) {
            throw new ValidationError('limitは1から10000の数値である必要があります', 'limit');
        }
    }

    return {
        statsDataId: obj.statsDataId as string,
        limit: obj.limit as number | undefined,
    };
}

/**
 * World Bank指標取得の引数を検証
 */
export function validateWorldBankGetIndicatorArgs(args: unknown): WorldBankGetIndicatorArgs {
    if (typeof args !== 'object' || args === null) {
        throw new ValidationError('引数はオブジェクトである必要があります');
    }

    const obj = args as Record<string, unknown>;

    if (!obj.countryCode || typeof obj.countryCode !== 'string') {
        throw new ValidationError('countryCodeは必須の文字列です', 'countryCode');
    }

    if (obj.countryCode.trim().length === 0 || obj.countryCode.length > 3) {
        throw new ValidationError('countryCodeは1-3文字の文字列である必要があります', 'countryCode');
    }

    if (!obj.indicatorCode || typeof obj.indicatorCode !== 'string') {
        throw new ValidationError('indicatorCodeは必須の文字列です', 'indicatorCode');
    }

    if (obj.indicatorCode.trim().length === 0) {
        throw new ValidationError('indicatorCodeは空文字列にできません', 'indicatorCode');
    }

    if ('startYear' in obj && obj.startYear !== undefined) {
        if (typeof obj.startYear !== 'number' || obj.startYear < 1960 || obj.startYear > 2100) {
            throw new ValidationError('startYearは1960から2100の数値である必要があります', 'startYear');
        }
    }

    if ('endYear' in obj && obj.endYear !== undefined) {
        if (typeof obj.endYear !== 'number' || obj.endYear < 1960 || obj.endYear > 2100) {
            throw new ValidationError('endYearは1960から2100の数値である必要があります', 'endYear');
        }
    }

    if ('startYear' in obj && 'endYear' in obj && obj.startYear && obj.endYear) {
        if (obj.startYear > obj.endYear) {
            throw new ValidationError('startYearはendYear以下である必要があります');
        }
    }

    return {
        countryCode: obj.countryCode as string,
        indicatorCode: obj.indicatorCode as string,
        startYear: obj.startYear as number | undefined,
        endYear: obj.endYear as number | undefined,
    };
}

/**
 * World Bank指標検索の引数を検証
 */
export function validateWorldBankSearchIndicatorsArgs(args: unknown): WorldBankSearchIndicatorsArgs {
    if (typeof args !== 'object' || args === null) {
        throw new ValidationError('引数はオブジェクトである必要があります');
    }

    const obj = args as Record<string, unknown>;

    if ('search' in obj && obj.search !== undefined) {
        if (typeof obj.search !== 'string') {
            throw new ValidationError('searchは文字列である必要があります', 'search');
        }
    }

    return {
        search: obj.search as string | undefined,
    };
}

/**
 * OECDデータ取得の引数を検証
 */
export function validateOECDGetDataArgs(args: unknown): OECDGetDataArgs {
    if (typeof args !== 'object' || args === null) {
        throw new ValidationError('引数はオブジェクトである必要があります');
    }

    const obj = args as Record<string, unknown>;

    if (!obj.datasetId || typeof obj.datasetId !== 'string') {
        throw new ValidationError('datasetIdは必須の文字列です', 'datasetId');
    }

    if (obj.datasetId.trim().length === 0) {
        throw new ValidationError('datasetIdは空文字列にできません', 'datasetId');
    }

    if ('filter' in obj && obj.filter !== undefined) {
        if (typeof obj.filter !== 'string') {
            throw new ValidationError('filterは文字列である必要があります', 'filter');
        }
    }

    if ('startPeriod' in obj && obj.startPeriod !== undefined) {
        if (typeof obj.startPeriod !== 'string') {
            throw new ValidationError('startPeriodは文字列である必要があります', 'startPeriod');
        }
    }

    if ('endPeriod' in obj && obj.endPeriod !== undefined) {
        if (typeof obj.endPeriod !== 'string') {
            throw new ValidationError('endPeriodは文字列である必要があります', 'endPeriod');
        }
    }

    return {
        datasetId: obj.datasetId as string,
        filter: obj.filter as string | undefined,
        startPeriod: obj.startPeriod as string | undefined,
        endPeriod: obj.endPeriod as string | undefined,
    };
}

/**
 * Eurostatデータ取得の引数を検証
 */
export function validateEurostatGetDataArgs(args: unknown): EurostatGetDataArgs {
    if (typeof args !== 'object' || args === null) {
        throw new ValidationError('引数はオブジェクトである必要があります');
    }

    const obj = args as Record<string, unknown>;

    if (!obj.datasetCode || typeof obj.datasetCode !== 'string') {
        throw new ValidationError('datasetCodeは必須の文字列です', 'datasetCode');
    }

    if (obj.datasetCode.trim().length === 0) {
        throw new ValidationError('datasetCodeは空文字列にできません', 'datasetCode');
    }

    if ('filters' in obj && obj.filters !== undefined) {
        if (typeof obj.filters !== 'object' || obj.filters === null || Array.isArray(obj.filters)) {
            throw new ValidationError('filtersはオブジェクトである必要があります', 'filters');
        }
    }

    if ('lang' in obj && obj.lang !== undefined) {
        if (typeof obj.lang !== 'string') {
            throw new ValidationError('langは文字列である必要があります', 'lang');
        }
        const validLangs = ['EN', 'DE', 'FR', 'IT', 'ES', 'PL', 'PT'];
        if (!validLangs.includes(obj.lang.toUpperCase())) {
            throw new ValidationError(`langは以下のいずれかである必要があります: ${validLangs.join(', ')}`, 'lang');
        }
    }

    return {
        datasetCode: obj.datasetCode as string,
        filters: obj.filters as Record<string, string> | undefined,
        lang: obj.lang as string | undefined,
    };
}

/**
 * ツール名に応じた引数の検証関数を取得
 */
export function getValidator(toolName: ToolName) {
    switch (toolName) {
        case 'estat_search_stats':
            return validateEStatSearchStatsArgs;
        case 'estat_get_data':
            return validateEStatGetDataArgs;
        case 'worldbank_get_indicator':
            return validateWorldBankGetIndicatorArgs;
        case 'worldbank_search_indicators':
            return validateWorldBankSearchIndicatorsArgs;
        case 'oecd_get_data':
            return validateOECDGetDataArgs;
        case 'eurostat_get_data':
            return validateEurostatGetDataArgs;
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}
