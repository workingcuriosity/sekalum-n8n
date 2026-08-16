import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class CredentialHubApi implements ICredentialType {
	name = 'credentialHubApi';

	displayName = 'Sekalum API';

	icon: Icon = {
		light: 'file:../icons/sekalum-node-icon-official.png',
		dark: 'file:../icons/sekalum-node-icon-official.dark.png',
	};

	documentationUrl =
		'https://github.com/workingcuriosity/sekalum-n8n';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://credential-hub.example.com',
			description: 'Credential HUB origin or deployment path, without a trailing slash.',
		},
		{
			displayName: 'Consumer API Token',
			name: 'consumerApiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Bearer token with the credentials:consume scope. Do not use a Management Token.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.consumerApiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/consumer/credentials',
			method: 'GET',
		},
	};
}
