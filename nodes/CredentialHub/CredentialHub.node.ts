import {
	NodeConnectionTypes,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { DISCOVERY_PATH, normalizeSecretNames } from './shared/consumerContract';

const showCredentialResource = { resource: ['credential'] };
const showResolveOperation = { resource: ['credential'], operation: ['resolve'] };
const showDiscoverOperation = { resource: ['credential'], operation: ['discover'] };

function isDataObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mapDiscoveryCredentials(body: IDataObject): INodeExecutionData[] {
	const data = isDataObject(body.data) ? body.data : undefined;
	const credentials = Array.isArray(data?.credentials) ? data.credentials : [];

	return credentials.filter(isDataObject).map((credential) => ({ json: credential }));
}

function normalizeProviderValue(value: unknown): string {
	return String(value ?? '').replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

export function filterDiscoveryCredentials(
	items: INodeExecutionData[],
	providerFilter: string,
): INodeExecutionData[] {
	const normalizedFilter = normalizeProviderValue(providerFilter);
	if (!normalizedFilter) return items;

	return items.filter(({ json }) => {
		const item = json as IDataObject;
		const metadata = isDataObject(item.metadata) ? item.metadata : undefined;
		const candidates = [item.providerKey, metadata?.providerKey, metadata?.displayName];
		return candidates.some((candidate) => normalizeProviderValue(candidate).includes(normalizedFilter));
	});
}

async function processDiscoveryResponse(
	this: IExecuteSingleFunctions,
	_inputData: INodeExecutionData[],
	responseData: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const providerFilter = String(this.getNodeParameter('providerFilter', '') ?? '');
	return filterDiscoveryCredentials(
		mapDiscoveryCredentials(isDataObject(responseData.body) ? responseData.body : {}),
		providerFilter,
	);
}

export class CredentialHub implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Sekalum',
		name: 'credentialHub',
	icon: {
		light: 'file:../../icons/sekalum-node-icon-official.png',
		dark: 'file:../../icons/sekalum-node-icon-official.dark.png',
	},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Native connector for the Credential HUB Consumer API.',
		usableAsTool: true,
		defaults: {
			name: 'Sekalum',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'credentialHubApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Credential',
						value: 'credential',
					},
				],
				default: 'credential',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: showCredentialResource },
				options: [
					{
						name: 'Discover',
						value: 'discover',
						action: 'Discover granted credentials',
						description: 'List active credentials granted to the Consumer API token',
						routing: {
							request: {
								method: 'GET',
								url: DISCOVERY_PATH,
							},
							output: {
								postReceive: [processDiscoveryResponse],
							},
						},
					},
					{
						name: 'Resolve',
						value: 'resolve',
						action: 'Resolve authorized secret fields',
						description: 'Resolve only explicitly granted secret fields for one credential',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/v1/consumer/credentials/{{$parameter.credentialKey}}/resolve',
							},
						},
					},
				],
				default: 'discover',
			},
			{
				displayName: 'Provider Filter',
				name: 'providerFilter',
				type: 'string',
				default: '',
				placeholder: 'Provider name or key',
				displayOptions: { show: showDiscoverOperation },
				description:
					'All providers: Returns every accessible credential. Specific provider: Filters Discover results locally. The Consumer API remains unchanged. Leave empty for all providers.',
			},
			{
				displayName: 'Credential Key',
				name: 'credentialKey',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: showResolveOperation },
					description: 'The public credentialKey returned by Consumer Discovery',
				placeholder: 'credential-public-key',
			},
			{
				displayName: 'Secret Fields',
				name: 'fieldNames',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: showResolveOperation },
				description:
					'Comma-separated secret field names already permitted by the Consumer Grant. Values are never entered here.',
					placeholder: 'accessToken, refreshToken',
				routing: {
					send: {
						type: 'body',
						property: 'secretNames',
						value: `={{ (${normalizeSecretNames.toString()})($value) }}`,
					},
				},
			},
		],
	};
}
