# Orbital — Social Gaming Hub

> A real-time communication platform with rooms, video calls, messaging — and Anomaly, a built-in social deduction game

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)

<img width="1896" height="1096" alt="image" src="https://github.com/user-attachments/assets/05d2e771-f61f-48fa-bd45-8c4fbf895ce5" />


Orbital is a modern social gaming hub. Sign in, land on the **Game Hub**, and either jump into **Anomaly** - a word-based imposter/social-deduction game with public matchmaking, room codes, and a live leaderboard - or head to **Rooms** and **Social** for group chat, direct messages, and video calls with friends. Every room, whether it's a game lobby or a plain chat room, carries its own voice/video call and screen share.

---

## Features

### Anomaly (built-in game)

- **Word-based social deduction** — almost everyone gets the same secret word; one or more imposters get something close, but not quite right
- **Turn-based clue rounds** — take turns describing your word without saying it, server-authoritative turn timer
- **Voting & reveal** — discuss who sounded off, then vote out the imposter(s)
- **Scoring & leaderboard** — voters who catch the imposter score points, an imposter who escapes detection scores more; first to the target score wins the match
- **Public matchmaking** — join a public lobby and auto-start with enough players, or create/join a private game room by code
- **Host controls** — the room host can manage round flow and settings
- **Countdown & round flow** — synced countdowns between rounds, with disconnect/reconnect-aware handling if a player drops mid-round
- **In-game call panel** — voice/video call and screen share docked alongside the game, so discussion happens live

### Messaging

- **Direct Messages** — send private messages to friends
- **Room Chat** — group conversations with multiple participants
- **Media Sharing** — share images and files in conversations
- **Message Reactions** — react to messages with emojis
- **@Mentions** — tag specific users in rooms, with autocomplete
- **Typing Indicators** — see when others are typing
- **Message Search** — search within a conversation's message history
- **Notifications** — real-time toasts and unread counters for messages and requests

### Social

- **Friend Management** — send, accept, and manage friend requests
- **Find People** — search for and add new users
- **Online Presence** — see who's online or away
- **Direct Chat** — dedicated 1:1 conversation interface, organized alongside Friends and Requests
- **User Profile Popups** — quick-view a user's profile and avatar from anywhere in the app

### Voice & Video Calls

- **Real-time Video** — face-to-face communication over WebRTC (PeerJS)
- **Screen Sharing** — share your screen during calls
- **Group Calls** — multi-participant video conversations
- **Persistent Calls** — continue calls while browsing between areas of the app, with a call-switch prompt if you try to join another
- **Call History** — see recent calls
- **Reconnect Handling** — presence-aware reconnect/disconnect handling in game rooms

### Customization

- **Avatar Maker** — build a custom avatar from layered parts and colors (`/avatar-maker`), previewable even when signed out
- **Custom Accent Colors** — personalize your interface
- **Profile & Preferences** — unified Settings tab (Profile / Avatar / Preferences sub-tabs)

### Privacy & Security

- **User Authentication** — secure login with Clerk
- **Account Deletion** — complete data control

---

## Tech Stack

### Frontend

| Technology                                                | Purpose                          |
| ----------------------------------------------------------- | ---------------------------------- |
| [Next.js 15](https://nextjs.org)                              | React framework with App Router   |
| [React 19](https://react.dev)                                 | UI library                         |
| [TypeScript](https://www.typescriptlang.org)                  | Type safety                        |
| [Tailwind CSS](https://tailwindcss.com)                       | Styling                            |
| [Framer Motion](https://www.framer.com/motion)                | Animations                         |
| [Zustand](https://zustand-demo.surge.sh)                      | State management                   |
| [Radix UI](https://www.radix-ui.com) / shadcn                 | Accessible components              |
| [React Three Fiber](https://r3f.docs.pmnd.rs) / three.js       | 3D-driven landing effects          |
| [OGL](https://github.com/oframe/ogl) / postprocessing          | Lightweight WebGL visual effects   |
| [Lenis](https://lenis.darkroom.engineering)                    | Smooth scrolling                   |
| [React Hook Form](https://react-hook-form.com)                 | Form handling                      |

### Backend

| Technology                        | Purpose                        |
| ------------------------------------ | --------------------------------- |
| [Convex](https://www.convex.dev)     | Real-time database & functions   |
| [Clerk](https://clerk.com)           | Authentication                    |
| [PeerJS](https://peerjs.com)         | WebRTC peer connections           |

### Testing

| Technology                                                 | Purpose                                                |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| [Vitest](https://vitest.dev)                                    | Test runner                                                |
| [convex-test](https://www.npmjs.com/package/convex-test)        | Simulated Convex backend for backend/game-logic tests      |

15 backend/game-logic test suites cover turn order, imposter selection, word assignment, voting, countdowns, host controls, disconnect/round flow, presence, room codes, public matchmaking (including dedup), session cleanup (including ghost sessions), the win condition, the leaderboard, and a full end-to-end game flow.

### Additional Libraries

- **@hugeicons/react** — Icon system
- **emoji-picker-react** — Emoji selection
- **react-dropzone** — File uploads
- **react-colorful** — Color pickers (accent color, avatar maker)
- **sonner** — Toast notifications
- **next-themes** — Theme handling

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Clerk account (for authentication)
- A Convex project (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/orbital.git
cd orbital

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CONVEX_SITE_URL=your_convex_site_url

# Optional: Custom deployment
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Run Tests

```bash
npm run test
```

Backend and game-logic tests run against a simulated Convex backend via `convex-test`.

### Lint

```bash
npm run lint
```

---

## Project Structure

```
orbital/
├── app/                          # Next.js App Router pages
│   ├── orbital/                   # Main app (authenticated)
│   │   ├── (main)/                 # Sidebar shell: Game Hub, Social, Rooms, Settings
│   │   │   ├── friends/              # Friends & requests
│   │   │   ├── rooms/                # Room list
│   │   │   ├── profile/              # Profile view
│   │   │   ├── settings/             # Settings shell
│   │   │   └── preferences/          # Preferences sub-tab
│   │   ├── anomaly/                # Anomaly matchmaking + full-screen landing/about page
│   │   │   └── about/                # Anomaly rules/about page
│   │   └── room/[room_id]/         # Room chat + call view (plain rooms and game rooms)
│   ├── avatar-maker/              # Standalone avatar customization page
│   ├── login/ · signup/           # Clerk auth pages
│   └── actions/                   # Server actions (e.g. random ID generation)
├── src/
│   ├── components/
│   │   ├── features/               # Feature-specific components
│   │   │   ├── anomaly/              # Anomaly game UI (lobby, rounds, voting, reveal, leaderboard)
│   │   │   ├── calls/                # Call UI
│   │   │   ├── friends/              # Friends, requests, find people, direct chats
│   │   │   ├── rooms/                # Room management, sidebar, in-room call panel
│   │   │   ├── messaging/            # Message list, input bar, message item
│   │   │   ├── notifications/        # Notification listener / toasts
│   │   │   ├── profile/              # Settings (profile / avatar / preferences)
│   │   │   └── auth/                 # Auth-related components
│   │   ├── avatar/                  # Avatar maker (parts, categories, color picker, SVG render)
│   │   ├── landing/                 # Marketing landing page sections
│   │   ├── layout/                  # Layout components (LeftSidebar, etc.)
│   │   ├── effects/                 # Visual effects (Starfield, PixelBlast, Dither)
│   │   ├── modals/                  # App-wide modals (create/join room, logout, call switch)
│   │   ├── popups/                  # Popovers (user profile popup)
│   │   ├── skeletons/               # Loading skeletons
│   │   ├── mocks/                   # Presentational mock components used on the landing page
│   │   └── ui/                      # Reusable UI primitives
│   ├── contexts/                    # React contexts (call, room, presence, preferences, color)
│   ├── store/                       # Zustand stores (user, UI, calls)
│   ├── hooks/                       # Shared hooks (presence, calls, messages, notifications, etc.)
│   └── lib/                         # Utilities (avatar, calls, games, theme, types)
├── convex/                          # Convex backend
│   ├── schema.ts                     # Database schema
│   ├── messages.ts / reactions.ts    # Message CRUD & reactions
│   ├── rooms.ts / roomQueries.ts     # Room management
│   ├── friends.ts / users.ts         # Friend system & user records
│   ├── calls.ts                      # Call handling
│   ├── presence.ts / typing.ts       # Presence & typing indicators
│   ├── chatNotifications.ts          # Notification generation
│   ├── storage.ts                    # File storage
│   ├── crons.ts                      # Scheduled jobs
│   ├── games/                        # Anomaly game logic (turn order, word assignment, voting, lobby config)
│   ├── gameSessions.ts / gameRounds.ts / gameEvents.ts / gamePresence.ts / gameRoomCode.ts
│   ├── publicMatchmaking.ts          # Public lobby matchmaking
│   └── *.test.ts                     # Vitest + convex-test backend tests
├── public/                          # Static assets
└── docs/                            # Documentation
```

---

## Architecture

### Frontend Flow

```
User → Clerk Auth → Convex Auth → Orbital Game Hub
                                      ↓
                     ┌────────────────┼────────────────┐
                     ↓                ↓                 ↓
                 Anomaly           Social            Rooms
             (matchmaking/          (friends,      (group chat &
              room code/            requests,       calls)
              leaderboard)          direct chats)
                     ↓                ↓                 ↓
              Game Room View    Direct Messages    Room Chat + Call
              (rounds + call)
```

### Real-time Data

Convex provides real-time subscriptions for:

- **Messages** — Instant message delivery
- **Presence** — Online/offline status
- **Typing** — Typing indicators
- **Notifications** — Real-time alerts and unread counters
- **Calls** — Live call state
- **Game State** — Anomaly session, round, turn, voting, and leaderboard updates

### Video Calling

```
PeerJS (WebRTC)
     ↓
Signaling via Convex
     ↓
P2P Media Streams
```

Calls run the same way whether the room is a plain chat room or an Anomaly game room, so discussion and gameplay can happen live side by side. Calls persist as you navigate the app, with a switch-call prompt if you try to join a different call while one is active.

---

## Available Scripts

| Command         | Description                              |
| ---------------- | ------------------------------------------ |
| `npm run dev`    | Start development server                  |
| `npm run build`  | Build for production                      |
| `npm run start`  | Start production server                   |
| `npm run lint`   | Run ESLint                                 |
| `npm run test`   | Run Vitest (backend & game-logic tests)   |

---
