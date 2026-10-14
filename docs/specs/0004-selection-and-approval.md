# 0004. Selection and approval

- **Status:** Draft
- **Related ADRs:** [0008](../adr/0008-google-sso-and-role-based-access.md)

## Goal

The analyst picks a supplier per line and submits; the manager approves or rejects.

## Requirements

- [ ] Top offer pre-selected per line. Picking another requires a reason.
- [ ] Submit → `PendingApproval`. Manager approves → `Approved`, or rejects with comment → `Rejected`; analyst can edit and resubmit.
- [ ] Role switcher in the header (analyst, manager, viewer) instead of real sign-in. API checks role on each action.
- [ ] Viewer is read-only. Self-approval allowed and marked in the audit trail.
- [ ] Request page shows status and audit trail.

## Out of scope

Real SSO, approval thresholds, per-country access, notifications.
