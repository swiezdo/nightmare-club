import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

export const MAX_API_PAYLOAD_BYTES = 256 * 1024;
export const SPAWN_POINT_MAX_LENGTH = 15;

export type ApiErrorDetail = {
	path: string;
	message: string;
};

type ApiErrorCode =
	| 'bad_request'
	| 'unauthorized'
	| 'forbidden'
	| 'not_found'
	| 'validation_error'
	| 'payload_too_large'
	| 'unsupported_media_type'
	| 'internal_error';

export function ok(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
	return json({ ok: true, ...body }, { status, headers });
}

export function fail(
	status: number,
	code: ApiErrorCode,
	message: string,
	details?: ApiErrorDetail[],
	headers?: HeadersInit
) {
	return json(
		{
			ok: false,
			error: {
				code,
				message,
				...(details?.length ? { details } : {})
			}
		},
		{ status, headers }
	);
}

function bearerAuthHeaders(error: 'invalid_token' | 'missing_token') {
	const description =
		error === 'missing_token' ? 'Bearer token is required.' : 'Bearer token is invalid.';
	return {
		'WWW-Authenticate': `Bearer realm="nightmare-club", error="${error}", error_description="${description}"`
	};
}

export function requireBearerToken(request: Request, expectedToken: string | undefined) {
	if (!expectedToken) {
		return fail(500, 'internal_error', 'Bearer token is not configured.');
	}

	const authorization = request.headers.get('authorization');
	if (!authorization?.startsWith('Bearer ')) {
		return fail(401, 'unauthorized', 'Missing bearer token.', undefined, bearerAuthHeaders('missing_token'));
	}

	const receivedToken = authorization.slice('Bearer '.length).trim();
	if (!timingSafeTokenEquals(receivedToken, expectedToken)) {
		return fail(401, 'unauthorized', 'Invalid bearer token.', undefined, bearerAuthHeaders('invalid_token'));
	}

	return null;
}

function timingSafeTokenEquals(received: string, expected: string) {
	const receivedBuffer = Buffer.from(received);
	const expectedBuffer = Buffer.from(expected);

	if (receivedBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function requireJsonRequest(request: Request) {
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().startsWith('application/json')) {
		return fail(415, 'unsupported_media_type', 'Content-Type must be application/json.');
	}

	const contentLength = request.headers.get('content-length');
	if (contentLength) {
		const bytes = Number(contentLength);
		if (Number.isFinite(bytes) && bytes > MAX_API_PAYLOAD_BYTES) {
			return fail(413, 'payload_too_large', 'Payload exceeds 256 KB.');
		}
	}

	return null;
}

export async function readJsonBody(request: Request) {
	try {
		return { data: await request.json() as unknown, error: null };
	} catch {
		return {
			data: null,
			error: fail(400, 'bad_request', 'Request body must be valid JSON.')
		};
	}
}

export function normalizeOptionalString(value: unknown) {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function collectUnexpectedKeys(
	value: Record<string, unknown>,
	allowedKeys: string[],
	path: string,
	details: ApiErrorDetail[]
) {
	const allowed = new Set(allowedKeys);
	for (const key of Object.keys(value)) {
		if (!allowed.has(key)) {
			details.push({ path: path ? `${path}.${key}` : key, message: 'Unknown field.' });
		}
	}
}

export function isIsoDate(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T12:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTuesday(value: string) {
	if (!isIsoDate(value)) return false;
	return new Date(`${value}T12:00:00Z`).getUTCDay() === 2;
}

let adminClient:
	| ReturnType<typeof createClient>
	| null = null;

export function getAdminSupabase() {
	if (!PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('Supabase admin environment variables are not configured.');
	}

	if (!adminClient) {
		adminClient = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});
	}

	return adminClient;
}
