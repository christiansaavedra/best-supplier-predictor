# 0008. Google SSO and role-based access

- **Status:** Accepted

## Context

Users are internal staff. Procurement needs a clear split between who picks suppliers and who approves.

## Decision

Sign-in with company Google accounts (OAuth 2.0 / OIDC). The API issues short-lived JWTs with the user's role: Analyst, Manager, Viewer, Admin. All roles can see supplier prices. Managers may approve their own requests (logged as self-approval).

## Alternatives considered

- **Email + password in our DB** — we would own password storage, resets and MFA for no benefit.
- **Block self-approval** — correct control, but blocks work when there is only one manager. Enable once there are several.
- **Hide unit prices from Viewers** — finance needs them.

## Consequences

- No passwords to manage; access ends when the Google account is disabled.
- Weaker segregation of duties until self-approval is blocked.
- No per-country scoping yet; users store a country so it can be added as a filter.
