<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Presentation architecture
- Keep the shared social-video theme in `src/styles.css` and apply semantic tokens through existing presentation components; this preserves behavior and keeps light/dark surfaces consistent.
- UI-only redesigns must leave handlers, queries, hooks, routes, media activation thresholds and advertising scripts unchanged; visual previews are references, never a source of new content or features.

## Shared posts
- Admin announcements use the separate public `/terms` route linked from profiles, with paginated reads and periodic refresh of `platform_ads`; keep home free of this component and preserve the admin write flow.
- Keep the home feed inclusive of text and video posts and periodically refresh its existing query; members viewing an open feed must also receive new public text posts without changing publishing or advertising behavior.

## Phone notifications
- Background notifications use standard Web Push (public/push-sw.js, VAPID keys derived from WEB_PUSH_KEY_SEED); database triggers call /api/public/web-push on the published URL with a per-event secret, so no third-party push account is needed.
