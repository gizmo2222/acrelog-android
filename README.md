# AcreLog

Farm equipment maintenance and fleet management for Android. Built for working farmers who need fast, reliable tracking of maintenance schedules, hours, downtime, and project work — from the field or the office.

## Features

- **Equipment fleet** — Track every piece of equipment with photos, hours, serial numbers, and custom fields per category
- **Maintenance scheduling** — Hour- and date-based intervals with overdue/due-soon status at a glance
- **Maintenance logs** — Full history with parts used, photos, and technician notes
- **Downtime tracking** — Log breakdowns and resolutions; see total downtime per machine
- **Projects & tasks** — Farm project management with task assignments, priorities, equipment hours, and parts costs
- **Reports** — Fleet overview with PDF maintenance history export (useful when selling equipment)
- **Multi-farm support** — Switch between farms; invite team members via QR code
- **Role-based access** — Owner, Manager, Worker, and Auditor roles with Firestore security rules
- **Notifications** — Local reminders when maintenance is coming due

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Language | TypeScript |
| UI | React Native Paper v5 (Material Design 3) |
| Navigation | React Navigation v7 |
| Backend | Firebase Firestore + Firebase Storage |
| Auth | Firebase Auth |
| Fonts | Barlow / Barlow Condensed (Google Fonts) |
| Build | EAS Build |

## Local Development

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Expo Go app on your Android device (or an Android emulator)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/gizmo2222/acrelog-android.git
   cd acrelog-android
   npm install
   ```

2. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com):
   - Enable **Firestore**, **Firebase Auth** (Email/Password), and **Storage**
   - Add an Android app with package name `com.acrelog.app`
   - Download `google-services.json` and place it in the project root

3. Add your Firebase config to `src/services/firebase.ts`:
   ```ts
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```

4. Deploy the Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. Start the dev server:
   ```bash
   npm start
   ```
   Scan the QR code with Expo Go on your device.

> **Note:** Local push notifications (maintenance reminders) do not work in Expo Go on Android as of SDK 53. They work in development and production builds.

## Building for Production

### Android (Google Play)

1. Configure EAS:
   ```bash
   eas build:configure
   ```

2. Build a signed AAB:
   ```bash
   eas build --platform android --profile production
   ```
   EAS manages the keystore automatically. **Back up your keystore** — it cannot be recovered and is required for all future updates.

3. Submit to Play Store:
   ```bash
   eas submit --platform android
   ```

### Play Store Publishing Steps

1. Create a [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)
2. Create the app listing — title, description, screenshots, 512×512 icon, 1024×500 feature graphic
3. Complete the content rating questionnaire and data safety form
4. Upload the `.aab` from EAS to a new Production release
5. Submit for review (1–3 days for initial release, hours for updates)

For each subsequent release, bump `android.versionCode` in `app.json`, rebuild, and resubmit.

## Project Structure

```
src/
  screens/
    auth/          Login, registration, farm selection
    equipment/     Equipment list, detail, form, serial scan
    farms/         Farm settings, category settings, member management
    maintenance/   Maintenance schedule, log form, task form
    projects/      Project list, detail, task edit
    reports/       Fleet reports and PDF export
    settings/      User profile and app settings
  services/
    firebase.ts    Firebase initialization
    auth.ts        Authentication
    equipment.ts   Equipment CRUD, photos, downtime
    maintenance.ts Maintenance tasks and logs
    farms.ts       Farm management, invites, QR codes
    projects.ts    Projects, tasks, comments, recurrence
    notifications.ts  Local maintenance reminders
  components/      Shared UI components
  hooks/           useAuth and other hooks
  types/           TypeScript type definitions
  constants/       Brand colors, equipment brands/models
  navigation/      Stack and tab navigator definitions
```

## Roles

| Role | Can do |
|---|---|
| Owner | Everything — full admin |
| Manager | All equipment and project operations |
| Worker | Log hours and maintenance; cannot archive or delete |
| Auditor | Read-only access to all data |

## License

Private — all rights reserved.
