/**
 * レート制限設定
 */
export interface RateLimitConfig {
    /** リクエスト間隔（ミリ秒） */
    interval: number;
    /** 間隔あたりの最大リクエスト数 */
    maxRequests: number;
}

/**
 * レート制限マネージャー
 */
export class RateLimiter {
    private requests: number[] = [];
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    /**
     * リクエストが許可されるまで待機
     */
    async waitForAvailability(): Promise<void> {
        const now = Date.now();
        
        // 古いリクエストを削除
        this.requests = this.requests.filter(
            (timestamp) => now - timestamp < this.config.interval
        );

        // レート制限に達している場合、待機
        if (this.requests.length >= this.config.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.config.interval - (now - oldestRequest);
            
            if (waitTime > 0) {
                await this.sleep(waitTime);
                // 待機後に再度チェック
                return this.waitForAvailability();
            }
        }

        // リクエストを記録
        this.requests.push(Date.now());
    }

    /**
     * 指定した時間だけ待機
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * レート制限の状態をリセット
     */
    reset(): void {
        this.requests = [];
    }
}

/**
 * データソースごとのレート制限設定
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    estat: {
        interval: 1000, // 1秒
        maxRequests: 10, // 1秒あたり10リクエスト
    },
    worldbank: {
        interval: 1000, // 1秒
        maxRequests: 5, // 1秒あたり5リクエスト
    },
    oecd: {
        interval: 1000, // 1秒
        maxRequests: 5, // 1秒あたり5リクエスト
    },
    eurostat: {
        interval: 1000, // 1秒
        maxRequests: 5, // 1秒あたり5リクエスト
    },
};

/**
 * グローバルなレート制限マネージャーのインスタンス
 */
const rateLimiters: Map<string, RateLimiter> = new Map();

/**
 * データソースのレート制限マネージャーを取得
 */
export function getRateLimiter(source: string): RateLimiter {
    if (!rateLimiters.has(source)) {
        const config = RATE_LIMIT_CONFIGS[source] || {
            interval: 1000,
            maxRequests: 10,
        };
        rateLimiters.set(source, new RateLimiter(config));
    }
    return rateLimiters.get(source)!;
}
