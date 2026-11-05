# Compact home, image posts, private chat and search
- [ ] Chat-only update: admin-only ID list/copy; external-list deletion with confirmation; 72-hour expiry; private live presence and opt-in sound/online alert; verify authorization and two-party flows.
- [ ] Explain managed-backup and disconnected-device deletion limits; verify admin entry without changing passwords.
- [ ] Current request: implement complete private text chat, incoming/outgoing friendship requests, six-digit private IDs, read receipts, bilateral deletion, blocking and reuse existing phone push; verify two-party flows and disclose device-test limits.
- [ ] Compact stories and the main advertising slot without changing other advertising or playback.
- [ ] Explain and obtain the external image provider decision before adoption; implement compressed gallery attachments, durable URL-only storage and lazy loading.
- [ ] Add private six-digit IDs, exact-ID friendship requests, accepted-only text chat, bilateral deletion and blocking with protected synchronized storage.
- [ ] Connect main search to relevant YouTube reel results with the search scope clarified.
- [ ] Verify privacy rules and signed-in flows on phone and desktop; preserve existing features.

# Admin announcements location
- [ ] Remove only admin announcements from home and add the profile link and separate auto-updating archive page.
- [ ] Verify the page, existing sections and admin access; explain existing sign-in and recovery without changing credentials.

# UI-only redesign
- [x] Remove the two animated mascot areas; move stories and the existing composer to the top without changing their actions.
- [x] Add direct standards-based background Web Push for comments, new posts and new members without Firebase or external accounts.
- [x] Tested signing/encryption and rejection of fake send requests; real phone delivery needs publishing and a device test by the owner.
- [x] Verify signed-in home, composer opening, reels, friends, profile, invite, earnings, notifications and auth page on desktop and phone; no runtime errors or phone overflow. Password-based login was not retested; auth code is unchanged.
- [x] Apply the selected social-video visual direction to shared theme and presentation components only.
- [x] Preserve all existing actions, content, ads, playback, routes and data; this verification changed no application code.
- [x] Verify signed-in creation controls, navigation and light/dark appearance on phone and desktop (1280px, 390px and 320px). Text creation was exercised with an unpublished draft; profile editing was opened and cancelled, without saving user data.

# Public text posts
- [x] Ensure text posts published with the red button appear in the shared home feed, retaining comments and reactions; refresh the existing feed every 10 seconds for members with the page already open.
- [x] Verify publishing, public visibility in a pre-opened guest feed, profile visibility, persisted commenting and liking through the UI. Removed only the temporary test post through its owner delete control; existing ads and data unchanged.