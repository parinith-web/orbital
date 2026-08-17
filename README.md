# Orbital

> A real-time communication platform with rooms, video calls, and seamless messaging

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)

Orbital is a modern real-time communication platform. It enables users to create rooms, send direct messages, make video calls, and collaborate seamlessly with friends and teams.

---

## Features

### Messaging

- **Direct Messages** — Send private messages to friends
- **Room Chat** — Group conversations with multiple participants
- **Media Sharing** — Share images and files in conversations
- **Message Reactions** — React to messages with emojis
- **@Mentions** — Tag specific users in rooms
- **Message Search** — Search through conversation history
- **Typing Indicators** — See when others are typing

### Friends & Social

- **Friend Management** — Send and accept friend requests
- **Online Presence** — See who's online or away
- **Friend Chat** — Dedicated 1:1 conversation interface

### Voice & Video Calls

- **Real-time Video** — Face-to-face communication
- **Screen Sharing** — Share your screen during calls
- **Group Calls** — Multi-participant video conversations
- **Persistent Calls** — Continue calls while browsing

### Customization

- **Custom Accent Colors** — Personalize your interface
- **Profile Customization** — Set avatar and username

### Privacy & Security

- **User Authentication** — Secure login with Clerk
- **Account Deletion** — Complete data control

---

## Tech Stack

### Frontend

| Technology                                     | Purpose                         |
| ---------------------------------------------- | ------------------------------- |
| [Next.js 15](https://nextjs.org)               | React framework with App Router |
| [React 19](https://react.dev)                  | UI library                      |
| [TypeScript](https://www.typescriptlang.org)   | Type safety                     |
| [Tailwind CSS](https://tailwindcss.com)        | Styling                         |
| [Framer Motion](https://www.framer.com/motion) | Animations                      |
| [Zustand](https://zustand-demo.surge.sh)       | State management                |
| [Radix UI](https://www.radix-ui.com)           | Accessible components           |

### Backend

| Technology                       | Purpose                        |
| -------------------------------- | ------------------------------ |
| [Convex](https://www.convex.dev) | Real-time database & functions |
| [Clerk](https://clerk.com)       | Authentication                 |
| [PeerJS](https://peerjs.com)     | WebRTC peer connections        |

### Additional Libraries

- **@hugeicons/react** — Icon system
- **emoji-picker-react** — Emoji selection
- **react-dropzone** — File uploads
- **sonner** — Toast notifications

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
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOY_KEY=your_convex_deploy_key

# Optional: Custom deployment
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Project Structure

```
orbital/
├── app/                    # Next.js App Router pages
│   ├── orbital/            # Main app (authenticated)
│   │   ├── (main)/        # Dashboard, friends, rooms
│   │   ├── profile/       # User profile settings
│   │   └── room/[room_id]/ # Room chat view
│   ├── login/             # Clerk login page
│   └── signup/            # Clerk signup page
├── src/
│   ├── components/        # React components
│   │   ├── features/      # Feature-specific components
│   │   │   ├── calls/     # Call UI
│   │   │   ├── friends/   # Friend management
│   │   │   ├── rooms/     # Room management
│   │   │   └── profile/  # Profile settings
│   │   ├── layout/        # Layout components
│   │   ├── effects/       # Visual effects (PixelBlast, Dither)
│   │   └── ui/            # Reusable UI components
│   ├── contexts/         # React contexts
│   └── lib/              # Utility functions
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── messages.ts       # Message CRUD
│   ├── rooms.ts          # Room management
│   ├── friends.ts        # Friend system
│   ├── calls.ts          # Call handling
│   └── ...
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## Architecture

### Frontend Flow

```
User → Clerk Auth → Convex Auth → Orbital Dashboard
                                      ↓
                            ┌─────────┼─────────┐
                            ↓         ↓         ↓
                        Rooms     Friends    Profile
                            ↓         ↓         ↓
                        Messages  Chat UI   Settings
```

### Real-time Data

Convex provides real-time subscriptions for:

- **Messages** — Instant message delivery
- **Presence** — Online/offline status
- **Typing** — Typing indicators
- **Notifications** — Real-time alerts
- **Calls** — Live call state

### Video Calling

```
PeerJS (WebRTC)
     ↓
Signaling via Convex
     ↓
P2P Media Streams
```

---

## Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

---
