# SEKALUM

<table><tr><td bgcolor="#05070a">
<img src="../icons/sekalum-logo-transparent.png" alt="SEKALUM — Credential Lifecycle &amp; Runtime Access" width="900">
</td></tr></table>

## for n8n

### One credential connection for your n8n workflows.

Sekalum centralizes Credential lifecycle, supported OAuth lifecycle handling,
Consumer Grants and controlled Credential access outside individual workflows.
The Sekalum n8n Node connects through the existing public Consumer API.

## Before

```text
Generic OAuth2   API Credentials
Token handling   HTTP credential requests
```

## After

```text
n8n
 │
 ▼
SEKALUM
 │
 ▼
Your application nodes
```

Application-specific n8n nodes may still be required to perform actions
against provider APIs. Sekalum centralizes access to the managed Credentials;
it does not replace those application nodes.

## Choose your workflow style

### A — Targeted

```text
Discover
Provider Filter
      ↓
Credential
      ↓
Resolve
```

Use this when the required provider is already known. Filtering is local to
the node and the Consumer API remains unchanged.

### B — Flexible

```text
Discover
All Providers
      ↓
Select by public credentialKey
      ↓
Resolve
```

Use this when the workflow should discover several accessible Credentials and
select one later. This path is provider-agnostic.

## Three things to remember

**Connect once**  
n8n connects to Sekalum through one Consumer credential.

**Discover dynamically**  
Find the public Credential entries available to the authenticated Consumer.

**Resolve explicitly**  
Request only the Secret fields the workflow needs and the Consumer Grant
allows.

## Trust boundary

- Discover does not expose Secret values.
- Consumer Grants remain enforced server-side.
- Keep Consumer API Tokens in n8n Credentials, not in workflow parameters.

## Open source

**Sekalum for n8n**  
Quick Start + example workflows

The public repository and final community URL are intentionally left open in
this concept until the official destination is confirmed.

---

This is an editable content concept, not the final graphic asset. The final
flyer should preserve this wording, the official Sekalum logo and the existing
black/gold visual language, and should be exported only after content review.
