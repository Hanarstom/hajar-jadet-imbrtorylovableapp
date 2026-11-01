# UI-only redesign
- [x] Remove the two animated mascot areas; move stories and the existing composer to the top without changing their actions.
- [ ] Add direct standards-based background Web Push for comments, new posts and new members without Firebase or external accounts.
- [ ] Test subscription permissions, database event targeting, encrypted delivery, notification clicks and existing preview sections; disclose device-only verification limits.
- [x] Verify signed-in home, composer opening, reels, friends, profile, invite, earnings, notifications and auth page on desktop and phone; no runtime errors or phone overflow. Password-based login was not retested; auth code is unchanged.
- [x] Apply the selected social-video visual direction to shared theme and presentation components only.
- [x] Preserve all existing actions, content, ads, playback, routes and data; this verification changed no application code.
- [x] Verify signed-in creation controls, navigation and light/dark appearance on phone and desktop (1280px, 390px and 320px). Text creation was exercised with an unpublished draft; profile editing was opened and cancelled, without saving user data.

# Public text posts
- [x] Ensure text posts published with the red button appear in the shared home feed, retaining comments and reactions; refresh the existing feed every 10 seconds for members with the page already open.
- [x] Verify publishing, public visibility in a pre-opened guest feed, profile visibility, persisted commenting and liking through the UI. Removed only the temporary test post through its owner delete control; existing ads and data unchanged.