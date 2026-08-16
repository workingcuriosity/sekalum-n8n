# SEKALUM

<table><tr><td bgcolor="#05070a">
<img src="../icons/sekalum-logo-transparent.png" alt="SEKALUM — Credential Lifecycle &amp; Runtime Access" width="900">
</td></tr></table>

# Sekalum for n8n

## Quick Start

Sekalum for n8n lets a workflow discover the Credentials that its Consumer is
allowed to use and explicitly resolve only the Secret fields needed by that
workflow. Sekalum remains the system that stores Credentials and enforces
Consumer Grants.

> **Connect n8n once to Sekalum. Keep provider credentials, OAuth lifecycle
> and credential access out of your workflows.**

For Credentials managed by Sekalum and granted to the Consumer, this removes
the need to rebuild credential-acquisition plumbing in every workflow. HTTP
requests for credential or token acquisition, repeated provider credential
configuration and workflow-owned token-rotation logic can be centralized in
Sekalum. This does not replace application-specific n8n nodes: a workflow may
still need the node that performs the actual action against the provider API.

### Before and after

Without Sekalum, a workflow may contain several credential and authentication
building blocks:

```text
n8n Workflow
    │
    ├── API Credentials
    ├── Generic OAuth2 configuration
    ├── Token handling
    ├── HTTP credential requests
    └── Application node
```

With Sekalum, the workflow uses one Consumer connection and the public
Discover/Resolve boundary:

```text
n8n Workflow
    │
    ▼
Sekalum Node
    │
    ├── Discover
    └── Resolve
    │
    ▼
Application node
```

```text
Credential lifecycle
OAuth lifecycle
Consumer Grants
Credential access
        │
        ▼
      Sekalum
```

## 1. What you need

You need:

- a running Sekalum instance;
- n8n with the Sekalum community node installed;
- a Sekalum Consumer and Consumer API Token;
- at least one active Credential; and
- a Consumer Grant for the Credential and Secret field your workflow needs.

Provider Secrets stay in Sekalum. They are not placed in the workflow JSON.

## 2. Connect n8n to Sekalum

In n8n, create a normal credential:

`Credentials → New Credential → Sekalum API`

Set:

- **Base URL** — the Sekalum origin, without a trailing slash;
- **Consumer API Token** — a token with the `credentials:consume` scope.

The connection is used by the Sekalum node. A workflow contains neither the
Provider Secret nor the Management Token.

```text
n8n Workflow
    ↓
Sekalum Node
    ↓
n8n Credential (Base URL + Consumer API Token)
    ↓
Sekalum Consumer API
```

## 3. Discover and Resolve

**Discover** returns one n8n item per Credential that the authenticated
Consumer may discover. Items contain public metadata, runtime-public values
and the public `credentialKey`; they do not contain Secret values.

**Resolve** requests explicitly selected Secret fields for one discovered
Credential. It uses the public `credentialKey` and the comma-separated field
names configured in the node. Grant enforcement remains server-side.

Discovery does not provide the Consumer Grant's grant-specific list of
authorized Secret names. Do not resolve every field marked `secret: true`.
Choose the Secret field required by your workflow and allowed by the Consumer
Grant.

## 4. Variant A — Targeted Provider

Use [Variant A — Targeted Provider](../examples/sekalum-variant-a-targeted-provider.json)
when you already know the provider you need.

1. Set **Provider Filter** to the provider name or public provider key.
2. Discover performs the unchanged Consumer API request.
3. The node filters the public Discover items locally.
4. Resolve receives the selected public `credentialKey` and an explicit field.

Replace the workflow placeholders `replace-with-provider-name-or-key` and
`replace-with-granted-secret-field` before running it. `accessToken` and
`apiKey` are examples only; the correct field depends on your Credential and
Consumer Grant.

## 5. Variant B — Discover & Select

Use [Variant B — Discover & Select](../examples/sekalum-variant-b-discover-select.json)
when you want to discover several Credentials and select one later.

1. Leave Provider Filter empty.
2. Discover returns all accessible Credentials as separate items.
3. Replace `selectedCredentialKey` in the Code node with the public
   `credentialKey` selected by your workflow.
4. Resolve the explicit Secret field required by the application and allowed
   by the Consumer Grant.

This example is provider-agnostic. It does not assume Twitch, OpenAI or any
other fixed provider list.

## 6. Error Cases

Use [Error Cases](../examples/sekalum-error-cases.json) only with dedicated
test credentials:

- **Invalid Consumer Token** → HTTP 401, `API_TOKEN_AUTH_FAILED`;
- **Missing Consumer Grant** → HTTP 403, `RESOLVE_NOT_AVAILABLE`.

For the second case, use a real existing Credential that has no matching Grant
for the test Consumer. A non-existent `credentialKey` tests a different 404
case and is not a Missing-Grant test.

## 7. Import the example workflows

In n8n, choose **Import from File**, select one of the linked JSON files and
assign your Sekalum API credential to the Sekalum nodes. The examples are
inactive until you run them manually.

The workflow notes use the portable `SEKALUM` wordmark and explain the setup.
The bitmap logo is shown in this Quick Start and in the package assets; it is
not embedded in workflow notes because a relative repository image path is not
portable across n8n imports and a remote or base64 image would make the
examples unreliable or unnecessarily large.

## 8. Next steps

- Read the [package README](../README.md) for node and API details.
- Use only the public Consumer API boundary.
- Keep Consumer API Tokens in n8n Credentials, never in workflow parameters.
- Keep resolved Secret values out of logs, stored executions and example
  exports.
- See the [Community Flyer concept](COMMUNITY_FLYER_CONCEPT.md) for a short,
  shareable overview of the integration.
