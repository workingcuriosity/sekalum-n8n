# Sekalum n8n Community Node

This package provides Sekalum, a native n8n connector for the existing
Credential HUB Consumer API. It does not change Credential HUB, add endpoints,
use the Management API, or introduce provider-specific behavior.

The npm package is published as `n8n-nodes-sekalum`. The internal
`credentialHub` node and `credentialHubApi` credential identifiers remain
unchanged implementation details. The product and user-facing documentation
use the Sekalum identity.

## Installation

Install `n8n-nodes-sekalum` as an n8n community node, then restart n8n before
using the Sekalum node and its **Sekalum API** credential.

## Start here

<table><tr><td bgcolor="#05070a">
<img src="icons/sekalum-logo-transparent.png" alt="SEKALUM — Credential Lifecycle &amp; Runtime Access" width="900">
</td></tr></table>

## Sekalum for n8n

Start with the [Sekalum Quick Start](docs/QUICK_START.md). It explains the
credential setup, Discover and Resolve, both selection variants and the
sanitized Error Cases workflow.

The [Community Flyer concept](docs/COMMUNITY_FLYER_CONCEPT.md) provides a
short, shareable overview without linking to a private or unconfirmed public
destination.

### Example Workflows

- [Variant A — Targeted Provider](examples/sekalum-variant-a-targeted-provider.json)
- [Variant B — Discover & Select](examples/sekalum-variant-b-discover-select.json)
- [Error Cases](examples/sekalum-error-cases.json)

## Architecture decision

The node uses n8n's declarative style. Credential HUB exposes a REST API and
the two operations map directly to stable HTTP requests:

- `GET /api/v1/consumer/credentials` for Discover;
- `POST /api/v1/consumer/credentials/:credentialKey/resolve` for Resolve.

Declarative routing keeps the package small and lets n8n handle request
execution, response handling, and item linking. Discover uses n8n's supported
`postReceive` output hook to map the public `data.credentials` collection into
one standard n8n item per credential. A programmatic node would add an
`execute()` implementation without a technical need: this integration does not
require external dependencies, non-REST calls, or platform-specific retry
logic.

## Sekalum API credential

Create **Sekalum API** with:

- **Base URL**: the Credential HUB origin or deployment path, without a
  trailing slash;
- **Consumer API Token**: a bearer token with the `credentials:consume` scope.

The credential adds:

```http
Authorization: Bearer <consumer-api-token>
```

The connection test calls Consumer Discovery. It is read-only, does not
resolve secrets, and treats a successful authenticated response—including an
empty granted-credential list—as a valid connection.

Management Tokens are intentionally unsupported.

## Sekalum node

The **Sekalum** node exposes one resource, **Credential**, with two operations:

### Discover

Returns one standard n8n item per active Credential granted to the configured
Consumer API token. Each item exposes the public `credentialKey`, metadata,
runtime-public values, and permitted field contract; it never contains secret
values.

The optional **Provider Filter** supports two local-selection variants:

- **Variant A — specific provider:** enter a provider name such as `Twitch` or
  `OpenAI API`. After the unchanged Discover request succeeds, the node filters
  the returned public items locally by provider metadata.
- **Variant B — all providers (default):** leave the filter empty. The node
  returns every accessible credential as one n8n item per credential; select a
  specific item later with a Switch, IF, Filter or Code node.

All providers:
Returns every accessible credential.

Specific provider:
Filters Discover results locally.
The Consumer API remains unchanged.

The filter checks a public provider key when one is present and otherwise uses
the public display name. It does not add request parameters, alter grants, or
resolve secrets. The node does not maintain a provider list.

### Resolve

Accepts the public `credentialKey` from the current n8n item using
`{{$json.credentialKey}}` and a comma-separated list of secret field names. It
sends only the field names in the existing Consumer Resolve request. Secret
values are returned only when Credential HUB authorizes the request through the
existing Consumer Grant contract.

The node keeps the Resolve field list explicit. Discovery publishes the public
field contract, including which fields are secret, but it does not publish the
Consumer Grant's authorized secret-name list. Selecting every `secret: true`
field would therefore risk requesting fields that are not granted. A workflow
must pass only the field names needed for the current operation and already
permitted by the existing grant; Credential HUB remains authoritative.

Do not enter secret values into node parameters. Do not use a Management Token
or a Management API endpoint.

## HTTP Request compatibility

The credential is registered as a normal n8n credential type and can be used
for custom API calls in the HTTP Request node through **Predefined Credential
Type**. Custom calls must remain within the public Consumer API boundary and
must follow the same token and secret-handling rules.

## Security model

- The Consumer API Token exists only in the n8n credential store.
- Tokens and resolved values are not logged by this package.
- Management endpoints and Management Tokens are not referenced.
- The node does not broaden grants, select provider-specific routes, or retry
  Resolve with a larger field list.
- Credential HUB remains authoritative for authentication, authorization,
  lifecycle state, grant matching, and secret-field eligibility.

## Local development

```bash
npm install
npm run build
npm run lint
npm test
```

For local n8n testing, run `npm run dev` and install a Credential HUB API
credential in the local n8n instance. Use a test HUB, a dedicated Consumer API
token, and an explicit Consumer Grant. Never put real tokens in workflows,
examples, tests, or source control.

## Example workflow

The token-free examples are the three linked workflows above. They use
placeholder values and require a user-supplied n8n Sekalum API credential.

Assign a test **Sekalum API** credential with an appropriate grant before
executing the success workflow. Configure an intentionally invalid credential
only when demonstrating the error workflow. Never put real tokens in
workflows, examples, tests, or source control.
