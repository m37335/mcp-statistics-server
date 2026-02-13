import axios, { AxiosError } from 'axios';

/**
 * APIエラーの詳細情報
 */
export interface ApiErrorDetails {
    statusCode?: number;
    statusText?: string;
    responseData?: unknown;
    requestUrl?: string;
    requestMethod?: string;
}

/**
 * カスタムAPIエラークラス
 */
export class ApiError extends Error {
    public readonly details: ApiErrorDetails;
    public readonly source: string;

    constructor(
        source: string,
        message: string,
        details: ApiErrorDetails = {}
    ) {
        super(message);
        this.name = 'ApiError';
        this.source = source;
        this.details = details;
    }

    /**
     * エラー情報をJSON形式で取得
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            source: this.source,
            message: this.message,
            details: this.details,
        };
    }
}

/**
 * AxiosエラーからApiErrorを作成
 */
export function createApiErrorFromAxiosError(
    source: string,
    error: unknown
): ApiError {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const details: ApiErrorDetails = {
            statusCode: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            responseData: axiosError.response?.data,
            requestUrl: axiosError.config?.url,
            requestMethod: axiosError.config?.method?.toUpperCase(),
        };

        let message = `${source} API error`;
        if (axiosError.response) {
            message = `${source} API error: ${axiosError.response.status} ${axiosError.response.statusText}`;
            if (axiosError.response.data) {
                const data = axiosError.response.data as any;
                if (data.error || data.message) {
                    message += ` - ${data.error || data.message}`;
                }
            }
        } else if (axiosError.request) {
            message = `${source} API error: No response received`;
        } else {
            message = `${source} API error: ${axiosError.message}`;
        }

        return new ApiError(source, message, details);
    }

    if (error instanceof Error) {
        return new ApiError(source, `${source} API error: ${error.message}`);
    }

    return new ApiError(source, `${source} API error: ${String(error)}`);
}

/**
 * エラーをユーザーフレンドリーなメッセージに変換
 */
export function formatErrorForUser(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return `予期しないエラーが発生しました: ${String(error)}`;
}
