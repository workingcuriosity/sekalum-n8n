import { describe, expect, it } from 'vitest';
import { CredentialHubApi } from '../credentials/CredentialHubApi.credentials';
import {
	CredentialHub,
	filterDiscoveryCredentials,
	mapDiscoveryCredentials,
} from '../nodes/CredentialHub/CredentialHub.node';

describe('Sekalum n8n package contract', () => {
	const credential = new CredentialHubApi();
	const description = new CredentialHub().description;
	const properties = description.properties ?? [];
	const operation = properties.find((property) => property.name === 'operation');

	it('stores only Base URL and Consumer API Token in the credential', () => {
		expect(credential.displayName).toBe('Sekalum API');
		expect(credential.properties.map((property) => property.name)).toEqual([
			'baseUrl',
			'consumerApiToken',
		]);
		expect(credential.authenticate.properties.headers?.Authorization).toBe(
			'=Bearer {{$credentials.consumerApiToken}}',
		);
		expect(credential.test.request.url).toBe('/api/v1/consumer/credentials');
	});

	it('uses Consumer Discovery for the credential test', () => {
		expect(credential.test.request.method).toBe('GET');
		expect(credential.test.request.baseURL).toBe('={{$credentials.baseUrl}}');
	});

	it('routes Discover and Resolve only through the public Consumer API', () => {
		expect(description.displayName).toBe('Sekalum');
		expect(description.defaults?.name).toBe('Sekalum');
		expect(description.description).toContain('Credential HUB Consumer API');
		const options = operation?.options ?? [];
		const discover = options.find((option) => option.value === 'discover');
		const resolve = options.find((option) => option.value === 'resolve');

		expect(discover?.routing?.request).toEqual({
			method: 'GET',
			url: '/api/v1/consumer/credentials',
		});
		expect(resolve?.routing?.request).toEqual({
			method: 'POST',
			url: '=/api/v1/consumer/credentials/{{$parameter.credentialKey}}/resolve',
		});
		expect(discover?.routing?.output?.postReceive).toHaveLength(1);
		expect(JSON.stringify(description)).not.toContain('/api/v1/management/');
	});

	it('maps each discovered credential to its own n8n item', () => {
		expect(
			mapDiscoveryCredentials({
				success: true,
				data: {
					credentials: [
						{ credentialKey: 'first', metadata: { displayName: 'First' } },
						{ credentialKey: 'second', runtimePublic: { host: 'example.test' } },
					],
				},
			}),
		).toEqual([
			{ json: { credentialKey: 'first', metadata: { displayName: 'First' } } },
			{ json: { credentialKey: 'second', runtimePublic: { host: 'example.test' } } },
		]);
	});

	it('keeps all Discover items when the Provider Filter is empty', () => {
		const items = mapDiscoveryCredentials({
			data: {
				credentials: [
					{ credentialKey: 'twitch', metadata: { displayName: 'Twitch API n8n' } },
					{ credentialKey: 'openai', metadata: { displayName: 'Open AI API n8n' } },
				],
			},
		});

		expect(filterDiscoveryCredentials(items, '')).toHaveLength(2);
	});

	it('filters Discover items locally by provider metadata', () => {
		const items = mapDiscoveryCredentials({
			data: {
				credentials: [
					{ credentialKey: 'twitch', metadata: { displayName: 'Twitch API n8n' } },
					{ credentialKey: 'openai', metadata: { displayName: 'Open AI API n8n' } },
					{ credentialKey: 'github', providerKey: 'github', metadata: { displayName: 'GitHub' } },
				],
			},
		});

		expect(filterDiscoveryCredentials(items, 'Twitch').map(({ json }) => json.credentialKey)).toEqual(['twitch']);
		expect(filterDiscoveryCredentials(items, 'OpenAI API').map(({ json }) => json.credentialKey)).toEqual([
			'openai',
		]);
		expect(filterDiscoveryCredentials(items, 'github').map(({ json }) => json.credentialKey)).toEqual(['github']);
		expect(filterDiscoveryCredentials(items, 'not-a-provider')).toEqual([]);
	});

	it('does not depend on provider order or a fixed provider list', () => {
		const items = mapDiscoveryCredentials({
			data: {
				credentials: [
					{ credentialKey: 'future', providerKey: 'future-provider', metadata: { displayName: 'Future Provider' } },
					{ credentialKey: 'openai', metadata: { displayName: 'Open AI API n8n' } },
					{ credentialKey: 'twitch', metadata: { displayName: 'Twitch API n8n' } },
				],
			},
		});

		expect(filterDiscoveryCredentials(items, 'future-provider').map(({ json }) => json.credentialKey)).toEqual([
			'future',
		]);
		expect(filterDiscoveryCredentials(items, '').map(({ json }) => json.credentialKey)).toEqual([
			'future',
			'openai',
			'twitch',
		]);
	});

	it('returns no items for an invalid discovery shape', () => {
		expect(mapDiscoveryCredentials({ success: true, data: { credentials: 'invalid' } })).toEqual([]);
	});

	it('sends field names in Resolve without exposing token fields as node parameters', () => {
		const fieldNames = properties.find((property) => property.name === 'fieldNames');

		expect(fieldNames?.routing?.send).toMatchObject({
			type: 'body',
			property: 'secretNames',
		});
		expect(properties.map((property) => property.name)).not.toContain('consumerApiToken');
		expect(fieldNames?.description).toContain('Values are never entered here');
	});

	it('keeps Resolve explicit because Discovery does not authorize every secret field', () => {
		const fieldNames = properties.find((property) => property.name === 'fieldNames');

		expect(fieldNames?.required).toBe(true);
		expect(fieldNames?.routing?.send?.value).toContain('normalizeSecretNames');
		expect(JSON.stringify(description)).not.toMatch(/secret:\s*true.*resolve|resolve.*secret:\s*true/i);
	});

	it('exposes an optional local Provider Filter only for Discover', () => {
		const providerFilter = properties.find((property) => property.name === 'providerFilter');

		expect(providerFilter).toMatchObject({
			displayName: 'Provider Filter',
			type: 'string',
			default: '',
		});
		expect(providerFilter?.description).toContain('Consumer API remains unchanged');
		expect(providerFilter?.displayOptions).toEqual({ show: { resource: ['credential'], operation: ['discover'] } });
	});

	it('uses declarative routing so n8n owns item linking and standard errors', () => {
		expect(description.inputs).toEqual(['main']);
		expect(description.outputs).toEqual(['main']);
		expect('execute' in new CredentialHub()).toBe(false);
	});
});
