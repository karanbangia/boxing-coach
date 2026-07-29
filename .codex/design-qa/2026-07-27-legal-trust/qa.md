# Legal, support, and sync-trust QA

Status: implementation complete locally; production publication pending review
and explicit approval.

## Product corrections

- Replaced plain legal copy with separate Terms and Privacy links in onboarding
  and profile sign-up
- Added Support, Terms of Use, and Privacy Policy rows to the guest profile and
  signed-in Account & Data view
- Corrected cloud-sync claims throughout onboarding, profile setup, sync status,
  sign-out, and account deletion
- The current implementation now says exactly what the code does: fighter
  profiles can sync through Firebase; workout history remains on the device
- External-link failures produce a user-facing alert instead of silently doing
  nothing

## Web surfaces

- Added responsive `/privacy.html`, `/terms.html`, `/support.html`, and
  `/support-success.html`
- Added a Netlify-compatible support form with a honeypot and distinct privacy
  request topic
- Privacy content covers guest/local data, Apple and Google sign-in, Firebase
  Auth/Firestore/Storage, optional photos, notifications, Netlify support
  requests, deletion, retention, and user choices
- Terms cover exercise risk, estimates, accounts, acceptable use, content,
  future store purchases, availability, third parties, and liability limits
- Mobile browser QA at 390 × 844 confirmed responsive typography, navigation,
  headings, cards, and form fields
- Desktop layout metrics at 1280 × 900 confirmed no horizontal overflow and a
  two-column support-card grid
- `pnpm --dir apps/web build` passed

## Native evidence

- iPhone 16e simulator, iOS 26.5
- Guest profile exposes Support, Terms of Use, and Privacy Policy as link-role
  elements
- Profile sign-up exposes Terms of Use and Privacy Policy as two distinct
  link-role elements
- `pnpm --dir apps/mobile exec tsc --noEmit` passed

## Publication gate

The intended production URLs are:

- `https://boxing-coach.netlify.app/privacy.html`
- `https://boxing-coach.netlify.app/terms.html`
- `https://boxing-coach.netlify.app/support.html`

Those paths returned 404 before this implementation and will remain unavailable
until the updated web bundle is published. The policy and terms are a
product-specific founder draft, not jurisdiction-specific legal advice. Review
the operator identity and governing-law requirements before production
publication.
