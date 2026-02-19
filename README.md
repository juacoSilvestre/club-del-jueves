# cdj-app

React + TypeScript app scaffolded without Vite, using React Scripts, Redux Toolkit, React Router, and MUI v5 with Roboto font.

## Getting started

1. Install dependencies (already run once):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm start
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Deploy to GitHub Pages (set homepage in package.json first):
   ```bash
   npm run deploy
   ```
4. Run tests:
   ```bash
   npm test
   ```

### Accounts (local)

- Sign-in uses local IndexedDB persons with a password hash (SHA-256, client-side).
- Register by creating a person via the Login page (name required, email optional); email is stored lowercase.
- You can sign in with either the saved email or the name plus the password you set during registration.

## App structure

- Routing: Home (`/`), Dashboard (`/dashboard`), Events (`/events`), Administration (`/admin`), and Login (`/login`) via React Router v6.
- Layout: MUI AppBar with navigation, themed using a custom MUI theme and Roboto font.
- State: Redux Toolkit store with `app` and `auth` slices; auth is persisted to `localStorage`.
- Deploy: `npm run deploy` publishes `build/` to `gh-pages` branch for GitHub Pages.

## Local data (IndexedDB)

- The app ships with an IndexedDB helper in `src/db.ts` using the `idb` package.
- Entities: `persons` (name, alias, birthdate, email), `events` (date, attendeeCount, totalFoodCost, totalDrinkCost), `eventDetails` (eventId, personId, note).
- Basic usage example:
   ```ts
   import { savePerson, getPersons, saveEvent, saveEventDetail } from './src/db';

   await savePerson({ name: 'Ada Lovelace', alias: 'Ada', birthdate: '1815-12-10', email: 'ada@example.com' });
   const persons = await getPersons();

   const eventId = await saveEvent({ date: '2024-12-24', attendeeCount: 10, totalFoodCost: 120, totalDrinkCost: 80 });
   await saveEventDetail({ eventId, personId: persons[0].id!, note: 'Arrived early' });
   ```
- Schemas are versioned; bump the version in `src/db.ts` when you add new stores or indexes.

Extend pages in `src/pages` and add slices under `src/features` as needed.
