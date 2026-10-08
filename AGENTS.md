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
