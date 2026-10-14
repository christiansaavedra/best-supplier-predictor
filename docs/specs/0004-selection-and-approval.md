# 0004. Selection and approval

- **Status:** Built
- **Related ADRs:** [0008](../adr/0008-google-sso-and-role-based-access.md)

## Goal

The analyst picks a supplier per line and submits; the manager approves or rejects.

## Requirements

- [x] Top offer pre-selected per line. Picking another requires a reason.
- [x] Submit → `PendingApproval`. Manager approves → `Approved`, or rejects with comment → `Rejected`; analyst can edit and resubmit.
- [x] Role switcher in the header (analyst, manager, viewer) instead of real sign-in. API checks role on each action.
- [x] Viewer is read-only. Self-approval allowed and marked in the audit trail.
- [x] Request page shows status and audit trail.

## Notes

- "Edit" after a rejection means changing supplier choices; lines and quantities are fixed once the request is created.
- Status changes check the current status inside the same database update, so two people acting at once cannot both succeed.
- Viewers see requests read-only; the New request page tells them to switch user.

## Out of scope

Real SSO, approval thresholds, per-country access, notifications.
