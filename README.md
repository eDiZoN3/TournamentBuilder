# Raro Volleyball Tournament Builder

A web application for organizing and running volleyball tournaments with friends. One administrator sets it up and runs the matches, while everyone else can view the live bracket from any device.

## Features

- **Automatic Bracket Generation**: Supports any number of teams (automatically pads to the next power of 2 with byes).
- **Double Elimination Structure**: Features a Winner Bracket for 1st/2nd place and a Loser Bracket for 3rd/4th place.
- **Flexible Team Creation**: Enter team names directly, or input players individually and let the app randomly group them.
- **Live Scoring**: Admin assigns courts to matches and enters scores in real-time. Supports Best-of-1 and Best-of-3 match formats.
- **Public Viewing**: No login required for spectators to follow the tournament bracket live.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (Mongoose)
- **Authentication**: NextAuth.js
- **Testing**: Vitest, React Testing Library

## Getting Started

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and configure your variables (e.g., MongoDB URI, NextAuth secret):
   ```bash
   cp .env.local.template .env.local
   ```

3. Seed the initial admin account:
   ```bash
   npm run seed:admin
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
