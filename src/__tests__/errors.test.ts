import axios from 'axios';
import { createApiErrorFromAxiosError, ApiError, formatErrorForUser } from '../errors.js';

describe('Errors', () => {
    describe('createApiErrorFromAxiosError', () => {
        it('should create ApiError from AxiosError with response', () => {
            const axiosError = {
                isAxiosError: true,
                response: {
                    status: 404,
                    statusText: 'Not Found',
                    data: { error: 'Resource not found' },
                },
                config: {
                    url: 'https://api.example.com/data',
                    method: 'get',
                },
            } as unknown as axios.AxiosError;

            const error = createApiErrorFromAxiosError('Test', axiosError);
            expect(error).toBeInstanceOf(ApiError);
            expect(error.source).toBe('Test');
            expect(error.details.statusCode).toBe(404);
            expect(error.details.responseData).toEqual({ error: 'Resource not found' });
        });

        it('should create ApiError from regular Error', () => {
            const regularError = new Error('Something went wrong');
            const error = createApiErrorFromAxiosError('Test', regularError);
            expect(error).toBeInstanceOf(ApiError);
            expect(error.message).toContain('Something went wrong');
        });

        it('should create ApiError from unknown error', () => {
            const error = createApiErrorFromAxiosError('Test', 'String error');
            expect(error).toBeInstanceOf(ApiError);
            expect(error.message).toContain('String error');
        });
    });

    describe('formatErrorForUser', () => {
        it('should format ApiError', () => {
            const apiError = new ApiError('Test', 'Test error message');
            const formatted = formatErrorForUser(apiError);
            expect(formatted).toBe('Test error message');
        });

        it('should format regular Error', () => {
            const error = new Error('Regular error');
            const formatted = formatErrorForUser(error);
            expect(formatted).toBe('Regular error');
        });

        it('should format unknown error', () => {
            const formatted = formatErrorForUser('String error');
            expect(formatted).toContain('String error');
        });
    });
});
