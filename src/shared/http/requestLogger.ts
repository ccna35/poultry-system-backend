import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';

import { Request, Response } from 'express';
import pino, { Logger, LoggerOptions } from 'pino';
import pinoHttp from 'pino-http';

import { AppConfig } from '../config/app.config';

type LoggingConfig = AppConfig['logging'];
type TerminalStream = Pick<NodeJS.WriteStream, 'isTTY' | 'write'>;
type RequestLogEntry = {
    msg?: string;
    err?: {
        message?: string;
        stack?: string;
    };
    req?: {
        id?: string;
        method?: string;
        url?: string;
    };
    res?: {
        statusCode?: number;
    };
    responseTime?: number;
};

const ANSI = {
    reset: '\u001b[0m',
    dim: '\u001b[90m',
    green: '\u001b[32m',
    cyan: '\u001b[36m',
    yellow: '\u001b[33m',
    red: '\u001b[31m',
};

export const serializeRequestForLog = (req: Request) => {
    return {
        id: req.id,
        method: req.method,
        url: req.originalUrl || req.url,
    };
};

export const serializeResponseForLog = (res: Response) => {
    return {
        statusCode: res.statusCode,
    };
};

export const shouldAutoLogRequest = (
    req: { method?: string; url?: string },
): boolean => {
    return req.method !== 'OPTIONS' && !(req.url ?? '').startsWith('/health');
};

export const shouldUsePrettyLogs = (
    config: LoggingConfig,
    destination: Pick<NodeJS.WriteStream, 'isTTY'> = process.stdout,
): boolean => {
    return config.environment !== 'production' && Boolean(destination.isTTY);
};

export const formatResponseTime = (responseTime: number | undefined): string => {
    if (responseTime === undefined) {
        return '-';
    }

    const rounded = responseTime >= 100
        ? Math.round(responseTime)
        : Math.round(responseTime * 10) / 10;

    return `${rounded}ms`;
};

export const formatDevelopmentRequestLine = (entry: RequestLogEntry): string => {
    const method = entry.req?.method ?? 'HTTP';
    const url = entry.req?.url ?? '-';
    const statusCode = entry.res?.statusCode ?? 0;
    const responseTime = colorize(ANSI.dim, formatResponseTime(entry.responseTime));
    const requestId = colorize(ANSI.dim, entry.req?.id ?? '-');

    return `${method} ${url} ${colorizeStatusCode(statusCode)} ${responseTime} ${requestId}`;
};

export const formatDevelopmentErrorLine = (entry: RequestLogEntry): string => {
    const requestId = entry.req?.id ? ` ${colorize(ANSI.dim, entry.req.id)}` : '';
    const message = entry.err?.message ?? entry.msg ?? 'Request failed';

    return `${colorize(ANSI.red, 'ERROR')} ${message}${requestId}`;
};

export const formatDevelopmentLogEntry = (entry: RequestLogEntry): string => {
    if (entry.req?.method && entry.req?.url && entry.res?.statusCode !== undefined) {
        return formatDevelopmentRequestLine(entry);
    }

    if (entry.err) {
        return formatDevelopmentErrorLine(entry);
    }

    return entry.msg ?? '';
};

export const createBaseLogger = (
    config: LoggingConfig,
    destination: TerminalStream = process.stdout,
): Logger => {
    const options: LoggerOptions = {
        level: config.level,
    };

    if (shouldUsePrettyLogs(config, destination)) {
        return pino(options, createDevelopmentLogStream(destination));
    }

    return pino(options);
};

export const createRequestLogger = (
    loggingConfig: LoggingConfig,
    baseLogger: Logger = createBaseLogger(loggingConfig),
) => {
    return pinoHttp({
        logger: baseLogger,
        autoLogging: {
            ignore: (req) => !shouldAutoLogRequest(req),
        },
        genReqId: (req, res) => {
            const incomingRequestId = req.headers['x-request-id'];
            const requestId = typeof incomingRequestId === 'string' && incomingRequestId.trim()
                ? incomingRequestId
                : randomUUID();

            res.setHeader('x-request-id', requestId);
            return requestId;
        },
        customLogLevel: (_req, res, error) => {
            if (error || res.statusCode >= 500) {
                return 'error';
            }

            if (res.statusCode >= 400) {
                return 'warn';
            }

            return 'info';
        },
        quietReqLogger: true,
        serializers: {
            req: serializeRequestForLog,
            res: serializeResponseForLog,
            err: pino.stdSerializers.err,
        },
    });
};

const createDevelopmentLogStream = (destination: TerminalStream): Writable => {
    return new Writable({
        write(chunk, _encoding, callback) {
            const raw = chunk.toString().trim();
            if (!raw) {
                callback();
                return;
            }

            try {
                const entry = JSON.parse(raw) as RequestLogEntry;
                destination.write(`${formatDevelopmentLogEntry(entry)}\n`);
            } catch {
                destination.write(`${raw}\n`);
            }

            callback();
        },
    });
};

const colorizeStatusCode = (statusCode: number): string => {
    const code = String(statusCode);

    if (statusCode >= 500) {
        return colorize(ANSI.red, code);
    }

    if (statusCode >= 400) {
        return colorize(ANSI.yellow, code);
    }

    if (statusCode >= 300) {
        return colorize(ANSI.cyan, code);
    }

    return colorize(ANSI.green, code);
};

const colorize = (color: string, value: string): string => {
    return `${color}${value}${ANSI.reset}`;
};
