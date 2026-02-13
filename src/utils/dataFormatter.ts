/**
 * データフォーマッター
 * 専門ツールで分析しやすい形式にデータを変換します
 */

export interface FormattedData {
    format: 'csv' | 'json' | 'json-stat';
    data: string | object;
    metadata?: {
        source: string;
        columns: string[];
        rowCount: number;
        description?: string;
    };
}

/**
 * データをCSV形式に変換
 */
export function formatAsCSV(data: Array<Record<string, unknown>>): string {
    if (data.length === 0) return '';

    // ヘッダーを取得
    const headers = Object.keys(data[0]);
    
    // CSVヘッダー
    const csvRows = [headers.join(',')];
    
    // データ行
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // 値のエスケープ処理
            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = String(value);
            // カンマや改行を含む場合はクォートで囲む
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

/**
 * データをJSON形式に変換（構造化）
 */
export function formatAsJSON(data: Array<Record<string, unknown>>, metadata?: Record<string, unknown>): object {
    return {
        metadata: metadata || {},
        data: data,
        count: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
    };
}

/**
 * World Bankデータを分析用に整形
 */
export function formatWorldBankDataForAnalysis(
    rawData: Array<{
        countryiso3code?: string;
        country?: { value?: string };
        date?: string;
        value?: number;
        indicator?: { value?: string; id?: string };
    }>
): Array<Record<string, unknown>> {
    return rawData
        .filter(d => d.value !== null && d.value !== undefined)
        .map(d => ({
            country_code: d.countryiso3code || '',
            country_name: d.country?.value || d.countryiso3code || '',
            year: d.date || '',
            value: d.value,
            indicator_id: d.indicator?.id || '',
            indicator_name: d.indicator?.value || '',
        }));
}

/**
 * e-Statデータを分析用に整形
 */
export function formatEStatDataForAnalysis(rawData: any): Array<Record<string, unknown>> {
    // e-Statのデータ構造に応じて変換
    if (Array.isArray(rawData)) {
        return rawData.map((item: any, index: number) => ({
            index: index,
            ...item,
        }));
    }
    
    // オブジェクトの場合は配列に変換
    if (typeof rawData === 'object' && rawData !== null) {
        return [rawData];
    }
    
    return [];
}

/**
 * データを時系列形式に変換（pandas等で使いやすい形式）
 */
export function formatAsTimeSeries(
    data: Array<Record<string, unknown>>,
    dateColumn: string,
    valueColumn: string,
    groupColumn?: string
): Array<Record<string, unknown>> {
    return data.map(row => ({
        date: row[dateColumn],
        value: row[valueColumn],
        ...(groupColumn ? { group: row[groupColumn] } : {}),
        ...Object.fromEntries(
            Object.entries(row).filter(([key]) => 
                key !== dateColumn && key !== valueColumn && key !== groupColumn
            )
        ),
    }));
}

/**
 * データをピボット形式に変換（国×年のマトリックスなど）
 */
export function formatAsPivot(
    data: Array<Record<string, unknown>>,
    indexColumn: string,
    columnsColumn: string,
    valuesColumn: string
): Array<Record<string, unknown>> {
    // インデックスとカラムのユニークな値を取得
    const indices = [...new Set(data.map(d => String(d[indexColumn])))];
    const columns = [...new Set(data.map(d => String(d[columnsColumn])))];
    
    // ピボットテーブルを作成
    const pivotData: Array<Record<string, unknown>> = [];
    
    indices.forEach(index => {
        const row: Record<string, unknown> = { [indexColumn]: index };
        
        columns.forEach(col => {
            const matchingRow = data.find(
                d => String(d[indexColumn]) === index && String(d[columnsColumn]) === col
            );
            row[col] = matchingRow ? matchingRow[valuesColumn] : null;
        });
        
        pivotData.push(row);
    });
    
    return pivotData;
}
