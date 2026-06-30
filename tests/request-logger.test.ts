import { describe, expect, it } from 'vitest';

import {
    formatDevelopmentErrorLine,
    formatDevelopmentLogEntry,
    formatDevelopmentRequestLine,
    formatResponseTime,
    serializeRequestForLog,
    shouldAutoLogRequest,
    shouldUsePrettyLogs,
} from '../src/shared/http/requestLogger';

const stripAnsi = (value: string): string => value.replace(/\u001b\[[0-9;]*m/g, '');

describe('requestLogger helpers', () => {
    it('formats response time in milliseconds', () => {
        expect(formatResponseTime(18.34)).toBe('18.3ms');
        expect(formatResponseTime(145.4)).toBe('145ms');
    });

    it('formats a concise development request line', () => {
        const line = formatDevelopmentRequestLine({
            req: {
                id: 'req-123',
                method: 'GET',
                url: '/api/cycles',
            },
            res: {
                statusCode: 200,
            },
            responseTime: 18.2,
        });

        expect(stripAnsi(line)).toBe('GET /api/cycles 200 18.2ms req-123');
    });

    it('formats a concise development error line', () => {
        const line = formatDevelopmentErrorLine({
            req: {
                id: 'req-123',
            },
            err: {
                message: 'Request failed',
            },
        });

        expect(stripAnsi(line)).toBe('ERROR Request failed req-123');
    });

    it('routes development formatting based on log content', () => {
        const requestLine = formatDevelopmentLogEntry({
            req: {
                id: 'req-123',
                method: 'POST',
                url: '/api/auth/login',
            },
            res: {
                statusCode: 429,
            },
            responseTime: 9.7,
        });
        const errorLine = formatDevelopmentLogEntry({
            err: {
                message: 'boom',
            },
        });

        expect(stripAnsi(requestLine)).toBe('POST /api/auth/login 429 9.7ms req-123');
        expect(stripAnsi(errorLine)).toBe('ERROR boom');
    });

    it('suppresses noisy automatic request logs', () => {
        expect(shouldAutoLogRequest({ method: 'GET', url: '/health' } as any)).toBe(false);
        expect(shouldAutoLogRequest({ method: 'OPTIONS', url: '/api/cycles' } as any)).toBe(false);
        expect(shouldAutoLogRequest({ method: 'GET', url: '/api/cycles' } as any)).toBe(true);
    });

    it('uses pretty logs only in interactive non-production terminals', () => {
        expect(shouldUsePrettyLogs(
            { environment: 'development', level: 'info' },
            { isTTY: true },
        )).toBe(true);
        expect(shouldUsePrettyLogs(
            { environment: 'production', level: 'info' },
            { isTTY: true },
        )).toBe(false);
        expect(shouldUsePrettyLogs(
            { environment: 'development', level: 'info' },
            { isTTY: false },
        )).toBe(false);
    });

    it('does not serialize sensitive request headers or cookies', () => {
        const serialized = serializeRequestForLog({
            id: 'request-1',
            method: 'GET',
            originalUrl: '/api/log-check',
            url: '/api/log-check',
            headers: {
                authorization: 'Bearer token',
                cookie: 'access_token=secret',
            },
            cookies: {
                access_token: 'secret',
            },
        } as any);

        expect(serialized).toEqual({
            id: 'request-1',
            method: 'GET',
            url: '/api/log-check',
        });
        expect(serialized).not.toHaveProperty('headers');
        expect(serialized).not.toHaveProperty('cookies');
    });
});
