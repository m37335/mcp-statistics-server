/**
 * データソースの出典情報
 */

export interface AttributionInfo {
    /** データソース名 */
    sourceName: string;
    /** 出典URL */
    sourceUrl: string;
    /** ライセンス情報 */
    license: string;
    /** 追加の出典情報（オプション） */
    additionalInfo?: string;
}

/**
 * データソースごとの出典情報を取得
 */
export function getAttribution(dataSource: string, indicatorCode?: string, statsDataId?: string): AttributionInfo {
    switch (dataSource) {
        case 'worldbank':
            return {
                sourceName: 'World Bank',
                sourceUrl: 'https://data.worldbank.org',
                license: 'CC BY 4.0',
                additionalInfo: indicatorCode ? `Indicator: ${indicatorCode}` : undefined,
            };

        case 'estat':
            return {
                sourceName: 'e-Stat（政府統計の総合窓口）',
                sourceUrl: 'https://www.e-stat.go.jp',
                license: '政府標準利用規約（第2.0版）準拠',
                additionalInfo: statsDataId ? `統計表ID: ${statsDataId}` : undefined,
            };

        case 'oecd':
            return {
                sourceName: 'OECD',
                sourceUrl: 'https://data.oecd.org',
                license: 'OECD利用条件に準拠',
                additionalInfo: 'OECD Data',
            };

        case 'eurostat':
            return {
                sourceName: 'Eurostat',
                sourceUrl: 'https://ec.europa.eu/eurostat',
                license: 'EU Open Data License',
                additionalInfo: 'European Union, 1995-2024',
            };

        default:
            return {
                sourceName: 'Unknown Source',
                sourceUrl: '',
                license: 'Unknown License',
            };
    }
}

/**
 * 出典情報をフォーマット
 */
export function formatAttribution(attribution: AttributionInfo): string {
    const parts: string[] = [];
    
    parts.push(`出典: ${attribution.sourceName}`);
    
    if (attribution.additionalInfo) {
        parts.push(attribution.additionalInfo);
    }
    
    parts.push(`ライセンス: ${attribution.license}`);
    parts.push(`URL: ${attribution.sourceUrl}`);
    
    return parts.join(' | ');
}
