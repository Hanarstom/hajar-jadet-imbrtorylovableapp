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