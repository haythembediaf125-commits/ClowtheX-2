# Building the Android APK — Style Stock Manager

This project is a React + Vite web app wrapped with **Capacitor** so it can be built into a native Android APK.

The web build is already verified. To produce the actual `.apk` file you need a machine with the Android SDK installed (Android Studio or the command-line tools). Two easy paths are described below.

---

## Option A — Build locally (Windows / macOS / Linux)

### 1. Install prerequisites once

- [Node.js 20+](https://nodejs.org/) and [pnpm 9+](https://pnpm.io/installation)
- [Android Studio](https://developer.android.com/studio) (this installs the Android SDK + JDK 17 automatically)
- During Android Studio setup, accept the SDK licenses.

### 2. Clone / copy this folder, then install deps

```bash
pnpm install
```

### 3. Generate the Android project (one-time)

```bash
cd artifacts/clowthex
pnpm run cap:add:android
```

This creates an `android/` folder containing the native Android project.

### 4. Build the APK

```bash
pnpm run android:apk
```

The signed-debug APK is produced at:

```
artifacts/clowthex/android/app/build/outputs/apk/debug/app-debug.apk
```

Copy that file to your phone and install it (enable "Install from unknown sources" first).

### 5. Open in Android Studio (optional, for release / Play Store)

```bash
pnpm run cap:open:android
```

Then `Build → Generate Signed Bundle / APK` and follow the wizard to produce a release APK / AAB.

---

## Option B — Build in the cloud with GitHub Actions (no local setup)

A ready-to-use workflow is included at `.github/workflows/build-android.yml` (in repo root).

1. Push this project to a GitHub repository.
2. Open the repo on GitHub → **Actions** → **Build Android APK** → **Run workflow**.
3. After ~5 minutes, download the `app-debug.apk` artifact from the run summary.

That APK can be installed directly on any Android phone.

---

## App identity

These values are set in `capacitor.config.ts` and `android/app/src/main/AndroidManifest.xml` (after `cap add android`).

| Setting   | Value                                  |
| --------- | -------------------------------------- |
| App name  | Style Stock Manager                    |
| App ID    | com.haythemgroup.stylestockmanager     |
| Web dir   | `dist`                                 |

To change the app name or icon later, edit `capacitor.config.ts` and the assets under `android/app/src/main/res/`, then run `pnpm run cap:sync`.

---

## Lovable watermark

All Lovable references have been removed:

- `lovable-tagger` plugin removed from `vite.config.ts` and `package.json`.
- `Lovable` social meta tags and twitter handle removed from `index.html`.
- The page title, description, and author have been preserved as set by you (Haythem Group).
