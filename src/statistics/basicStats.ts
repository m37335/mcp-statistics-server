/**
 * 基本的な統計量の計算
 */

export interface StatisticsResult {
    mean?: number;
    median?: number;
    mode?: number;
    std?: number;
    variance?: number;
    min?: number;
    max?: number;
    range?: number;
    q1?: number;
    q3?: number;
    iqr?: number;
    count: number;
    sum?: number;
}

/**
 * 平均値を計算
 */
export function calculateMean(values: number[]): number {
    if (values.length === 0) return NaN;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 中央値を計算
 */
export function calculateMedian(values: number[]): number {
    if (values.length === 0) return NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/**
 * 最頻値を計算
 */
export function calculateMode(values: number[]): number {
    if (values.length === 0) return NaN;
    const frequency: Record<number, number> = {};
    values.forEach(v => {
        frequency[v] = (frequency[v] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mode = values[0];
    Object.entries(frequency).forEach(([value, freq]) => {
        if (freq > maxFreq) {
            maxFreq = freq;
            mode = Number(value);
        }
    });
    
    return mode;
}

/**
 * 標準偏差を計算
 */
export function calculateStdDev(values: number[]): number {
    if (values.length === 0) return NaN;
    const mean = calculateMean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * 分散を計算
 */
export function calculateVariance(values: number[]): number {
    if (values.length === 0) return NaN;
    const mean = calculateMean(values);
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

/**
 * 四分位数を計算
 */
export function calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
    if (values.length === 0) return { q1: NaN, q2: NaN, q3: NaN };
    
    const sorted = [...values].sort((a, b) => a - b);
    const q2 = calculateMedian(sorted);
    
    const mid = Math.floor(sorted.length / 2);
    const lowerHalf = sorted.slice(0, mid);
    const upperHalf = sorted.slice(sorted.length % 2 === 0 ? mid : mid + 1);
    
    return {
        q1: calculateMedian(lowerHalf),
        q2: q2,
        q3: calculateMedian(upperHalf),
    };
}

/**
 * 基本的な統計量を計算
 */
export function calculateStatistics(
    values: number[],
    requestedStats: Array<'mean' | 'median' | 'mode' | 'std' | 'variance' | 'min' | 'max' | 'range' | 'q1' | 'q3' | 'iqr'>
): StatisticsResult {
    if (values.length === 0) {
        return { count: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const result: StatisticsResult = { count: values.length };
    
    if (requestedStats.includes('mean')) {
        result.mean = calculateMean(values);
    }
    if (requestedStats.includes('median')) {
        result.median = calculateMedian(values);
    }
    if (requestedStats.includes('mode')) {
        result.mode = calculateMode(values);
    }
    if (requestedStats.includes('std')) {
        result.std = calculateStdDev(values);
    }
    if (requestedStats.includes('variance')) {
        result.variance = calculateVariance(values);
    }
    if (requestedStats.includes('min')) {
        result.min = sorted[0];
    }
    if (requestedStats.includes('max')) {
        result.max = sorted[sorted.length - 1];
    }
    if (requestedStats.includes('range')) {
        result.range = sorted[sorted.length - 1] - sorted[0];
    }
    if (requestedStats.includes('q1') || requestedStats.includes('q3') || requestedStats.includes('iqr')) {
        const quartiles = calculateQuartiles(values);
        if (requestedStats.includes('q1')) {
            result.q1 = quartiles.q1;
        }
        if (requestedStats.includes('q3')) {
            result.q3 = quartiles.q3;
        }
        if (requestedStats.includes('iqr')) {
            result.iqr = quartiles.q3 - quartiles.q1;
        }
    }
    
    // sumは常に計算（メタデータとして有用）
    result.sum = values.reduce((sum, v) => sum + v, 0);
    
    return result;
}

/**
 * グループ別に統計量を計算
 */
export function calculateGroupedStatistics(
    data: Array<Record<string, unknown>>,
    groupColumn: string,
    valueColumn: string,
    requestedStats: Array<'mean' | 'median' | 'mode' | 'std' | 'variance' | 'min' | 'max' | 'range' | 'q1' | 'q3' | 'iqr'>
): Array<Record<string, unknown>> {
    // グループごとにデータを分割
    const groups: Record<string, number[]> = {};
    
    data.forEach(row => {
        const group = String(row[groupColumn] || '');
        const value = Number(row[valueColumn]);
        
        if (!isNaN(value)) {
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(value);
        }
    });
    
    // 各グループの統計量を計算
    return Object.entries(groups).map(([group, values]) => {
        const stats = calculateStatistics(values, requestedStats);
        return {
            [groupColumn]: group,
            ...stats,
        };
    });
}
