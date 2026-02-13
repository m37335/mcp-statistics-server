import axios, { AxiosError } from 'axios';

/**
 * リトライ設定
 */
export interface RetryConfig {
    /** 最大リトライ回数（デフォルト: 3） */
    maxRetries?: number;
    /** 初期待機時間（ミリ秒、デフォルト: 1000） */
    initialDelay?: number;
    /** 最大待機時間（ミリ秒、デフォルト: 10000） */
    maxDelay?: number;
    /** 指数バックオフの乗数（デフォルト: 2） */
    multiplier?: number;
    /** リトライするHTTPステータスコード（デフォルト: [429, 500, 502, 503, 504]） */
    retryableStatusCodes?: number[];
}

/**
 * デフォルトのリトライ設定
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    multiplier: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504],
};

/**
 * リトライ可能なエラーかどうかを判定
 */
function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
    if (!axios.isAxiosError(error)) {
        return false;
    }

    const axiosError = error as AxiosError;

    // ネットワークエラー（リクエストが送信されなかった）
    if (!axiosError.response) {
        return true;
    }

    // リトライ可能なステータスコードかチェック
    const statusCode = axiosError.response.status;
    return retryableStatusCodes.includes(statusCode);
}

/**
 * 指数バックオフで待機時間を計算
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    const delay = config.initialDelay * Math.pow(config.multiplier, attempt);
    return Math.min(delay, config.maxDelay);
}

/**
 * 指定した時間だけ待機
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * リトライ機能付きで関数を実行
 * @param fn - 実行する関数
 * @param config - リトライ設定
 * @returns 関数の実行結果
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const retryConfig: Required<RetryConfig> = {
        ...DEFAULT_RETRY_CONFIG,
        ...config,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // 最後の試行でない場合、リトライ可能かチェック
            if (attempt < retryConfig.maxRetries) {
                if (isRetryableError(error, retryConfig.retryableStatusCodes)) {
                    const delay = calculateDelay(attempt, retryConfig);
                    await sleep(delay);
                    continue;
                }
            }

            // リトライ不可能なエラーまたは最後の試行
            throw error;
        }
    }

    // このコードには到達しないはずだが、TypeScriptの型チェックのために必要
    throw lastError;
}
