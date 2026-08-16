import { describe, expect, it } from 'vitest';
import { DISCOVERY_PATH, normalizeSecretNames } from '../nodes/CredentialHub/shared/consumerContract';

describe('Credential HUB Consumer contract helpers', () => {
	it('uses the existing public Discovery route', () => {
		expect(DISCOVERY_PATH).toBe('/api/v1/consumer/credentials');
	});

	it('normalizes only secret field names, never values', () => {
		expect(normalizeSecretNames(' accessToken, refreshToken ,, ')).toEqual([
			'accessToken',
			'refreshToken',
		]);
	});

	it('rejects an empty field list at the contract boundary', () => {
		expect(normalizeSecretNames(' , ')).toEqual([]);
	});
});
