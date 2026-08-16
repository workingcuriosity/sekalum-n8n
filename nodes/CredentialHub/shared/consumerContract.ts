export const DISCOVERY_PATH = '/api/v1/consumer/credentials';

export function normalizeSecretNames(value: string): string[] {
	return value
		.split(',')
		.map((field) => field.trim())
		.filter((field) => field.length > 0);
}
