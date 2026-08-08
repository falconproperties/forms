# Forms by Falcon Properties — Setup Guide

A drag-and-drop forms platform: Creators build forms visually, publish them behind a
random unguessable link, anonymous visitors fill them in without an account, and a
Super Admin controls who can create forms and which IP addresses can reach the app.

---

## 1. File map

```
index.html          Creator sign in / request access
superadmin.html      Super Admin sign in (no signup — provisioned manually)
dashboard.html       Creator's form list, create/delete, copy share link
builder.html         Drag-and-drop form builder
f.html               Public form-fill page (reached via the random link)
responses.html       Creator's response table + CSV export
admin-panel.html     Super Admin: approve creators, manage IP whitelist
blocked.html         Shown when a visitor's IP isn't whitelisted
shared/app-core.js   Firebase init, auth helpers, IP gate, field-type registry
shared/styles.css    Design system (creme / royal gold / Fraunces + Outfit)
firestore.rules      Database security rules
assets/logo.png      Your uploaded crest
```

## 2. Firebase project setup

1. Go to the [Firebase Console](https://console.firebase.google.com) → **Create project**.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (start in production mode).
4. **Project settings → General → Your apps → Add app → Web (`</>`)** — copy the config object.
5. Paste it into `shared/app-core.js` at the top, replacing every `"REPLACE_ME"`.

## 3. Deploy the security rules

In the Firebase Console: **Firestore Database → Rules** → paste the contents of
`firestore.rules` → **Publish**. (Or use the Firebase CLI: `firebase deploy --only firestore:rules`.)

These rules enforce, at the database layer — not just in the UI:
- Only an approved creator can create/edit/delete **their own** forms.
- Anyone can submit to a form only while it is `published`.
- Submissions are write-once — nobody can edit or delete a response after it's sent.
- Only the Super Admin can approve creators or edit the IP whitelist.

## 4. Bootstrap your Super Admin account

There's no signup for Super Admin by design, so the first one must be created by hand:

1. Firebase Console → **Authentication → Users → Add user** → enter your email + password.
2. Copy the generated **User UID**.
3. Firestore Database → **Start collection** → collection ID `users` → document ID = that UID → add fields:
   - `role` (string) = `superadmin`
   - `email` (string) = your email
4. **Whitelist your own IP** (or you'll lock yourself out): find your IP at
   [whatismyipaddress.com](https://whatismyipaddress.com), then in Firestore create collection
   `ipWhitelist` → document ID = your IP address → fields: `active` (boolean) = `true`, `note` (string) = `"bootstrap"`.
5. Open `superadmin.html` and sign in.

From there, every creator who requests access via `index.html` will show up in your
admin panel for approval, and you add each new office/location's IP the same way.

## 5. Hosting

Since the whole stack is static HTML/CSS/JS + Firebase, any static host works
(Firebase Hosting, Netlify, or your existing hosting). Firebase Hosting is the
path of least friction since you're already on Firebase:

```
npm install -g firebase-tools
firebase login
firebase init hosting     # point the public directory at this folder
firebase deploy
```

## 6. Known limitations — read before relying on these in production

- **IP restriction is a deterrent, not a hard lock.** Per your call, it's enforced
  client-side via an IP-lookup API check against Firestore. A technically determined
  visitor can bypass client-side checks (e.g. via devtools). The Firestore rules
  still stop unapproved creators from writing data even if they get past the IP
  screen — but the *page itself* isn't invisible to them the way a server-side
  (Cloud Function) check would make it. If this ever needs to be a hard boundary,
  it should move server-side.
- **"One submission per visitor" is enforced via `localStorage`.** It stops casual
  duplicate submits, but clearing browser data or using another browser/device
  resets it. There's no way to do this without requiring some form of login,
  which was explicitly out of scope for viewers.
- **File upload fields currently store only the file name/size as a placeholder**,
  not the file itself. Wiring this to Firebase Storage is a small, contained addition
  I can do next if you want real file uploads to work.
- **Random links** use a 12-character slug (32-symbol alphabet, no ambiguous
  characters) — effectively unguessable, but it's not literally impossible to
  brute-force server-side rate limiting is a good future addition if these ever
  guard something sensitive.

## 7. What's already built

All 22 field types from your brief are wired end-to-end: short/long text, email,
phone, number, date, time, dropdown, single/multi choice, tickbox, level slider,
star rating, NPS, ranking (drag to reorder), matrix grid, file upload, signature
pad, address, section breaks, page breaks (multi-page forms), image/media blocks,
hidden fields, and per-field conditional logic ("show this field only if…").
