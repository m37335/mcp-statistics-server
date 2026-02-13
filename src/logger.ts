/**
 * ログレベル
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * ログエントリ
 */
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    source?: string;
    data?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

/**
 * ロガークラス
 */
export class Logger {
    private minLevel: LogLevel;
    private source?: string;

    constructor(source?: string, minLevel: LogLevel = LogLevel.INFO) {
        this.source = source;
        this.minLevel = minLevel;
    }

    /**
     * ログエントリを作成
     */
    private createLogEntry(
        level: LogLevel,
        message: string,
        data?: Record<string, unknown>,
        error?: Error
    ): LogEntry {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
        };

        if (this.source) {
            entry.source = this.source;
        }

        if (data) {
            entry.data = data;
        }

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }

        return entry;
    }

    /**
     * ログを出力
     */
    private log(entry: LogEntry): void {
        if (entry.level < this.minLevel) {
            return;
        }

        // stderrに出力（MCPサーバーはstdioを使用するため）
        const logString = JSON.stringify(entry);
        console.error(logString);
    }

    /**
     * DEBUGレベルのログ
     */
    debug(message: string, data?: Record<string, unknown>): void {
        this.log(this.createLogEntry(LogLevel.DEBUG, message, data));
    }

    /**
     * INFOレベルのログ
     */
    info(message: string, data?: Record<string, unknown>): void {
        this.log(this.createLogEntry(LogLevel.INFO, message, data));
    }

    /**
     * WARNレベルのログ
     */
    warn(message: string, data?: Record<string, unknown>): void {
        this.log(this.createLogEntry(LogLevel.WARN, message, data));
    }

    /**
     * ERRORレベルのログ
     */
    error(message: string, error?: Error, data?: Record<string, unknown>): void {
        this.log(this.createLogEntry(LogLevel.ERROR, message, data, error));
    }

    /**
     * リクエストログ
     */
    logRequest(toolName: string, args: unknown): void {
        this.info('Tool request', {
            tool: toolName,
            args,
        });
    }

    /**
     * レスポンスログ
     */
    logResponse(toolName: string, success: boolean, duration?: number): void {
        this.info('Tool response', {
            tool: toolName,
            success,
            duration,
        });
    }
}

/**
 * デフォルトロガー
 */
export const defaultLogger = new Logger('MCP-Statistics-Server');
