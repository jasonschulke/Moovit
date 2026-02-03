# Moove

A personal workout tracking Progressive Web App (PWA) built with React, TypeScript, and Tailwind CSS.

## Features

- **Workout Tracking**: Log exercises with weights, reps, and duration
- **Exercise Library**: Browse 50+ built-in exercises organized by movement pattern
- **Custom Workouts**: Create and save workout templates to your library
- **Progress Visualization**: GitHub-style contribution calendar, sparklines, and stats
- **AI Coach**: Chat with Claude for workout advice, motivation, and exercise suggestions
- **Apple Health Import**: Import workouts, body metrics, and activity data from Apple Health exports
- **Equipment Inventory**: Track your home gym gear and available weights
- **Toast Notifications**: Contextual feedback when adding exercises or completing actions
- **TV Mode**: Landscape workout display triggered on first rotation
- **Offline Support**: Full PWA with offline capability
- **Dark/Light Mode**: System-aware theme with manual toggle

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS v4** for styling
- **PWA** with Workbox for offline support
- **LocalStorage** for data persistence
- **Supabase** for optional cloud sync and auth

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Button.tsx
│   ├── ClaudeChat.tsx
│   ├── EffortChart.tsx
│   ├── EffortPicker.tsx
│   ├── EquipmentGallery.tsx
│   ├── EquipmentManager.tsx
│   ├── ExerciseView.tsx
│   ├── HealthImport.tsx
│   ├── NavBar.tsx
│   ├── Onboarding.tsx
│   ├── Timer.tsx
│   ├── WorkoutBuilder.tsx
│   └── WorkoutStartFlow.tsx
├── contexts/           # React context providers
│   └── ToastContext.tsx
├── data/               # Data layer and storage
│   ├── exercises.ts        # Exercise definitions
│   ├── healthImport.ts     # Apple Health XML parser
│   ├── storage.ts          # LocalStorage persistence
│   ├── sync.ts             # Cloud sync
│   └── workouts.ts         # Workout templates
├── hooks/              # React hooks
│   ├── useTimer.ts
│   └── useWorkout.ts
├── pages/              # Page components
│   ├── HomePage.tsx
│   ├── LibraryPage.tsx
│   ├── SettingsPage.tsx
│   └── WorkoutPage.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── exerciseGifs.ts
│   └── uuid.ts
├── App.tsx             # Main application component
├── index.css           # Global styles and animations
└── main.tsx            # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Home Page
- View your workout statistics and streaks
- Track monthly and yearly progress with contribution calendars
- Tap dates to mark rest days or add backlog workouts

### Workout Page
- Start a new workout or continue saved templates
- Log each exercise with weight, reps, and optional notes
- View exercise progress sparklines during active workouts
- Rate overall workout effort when complete
- TV mode activates on first landscape rotation

### Library
- Browse and manage saved workout templates
- View exercise library organized by movement pattern
- Create custom exercises
- Manage your equipment inventory under the Gear tab

### Chat
- Get AI-powered workout advice from Claude
- Ask questions about form, programming, or nutrition
- Add suggested exercises directly to your library
- Submit feedback via the in-chat feedback button

### Settings
- Toggle dark/light theme
- Choose AI coach personality
- Import Apple Health data (workouts, body metrics, activity summaries)
- Manage custom exercises
- Export your workout data

## Data Storage

All data is stored locally in the browser's localStorage:
- Workout sessions and history
- Custom exercises and saved workouts
- Equipment inventory and weights
- Body metrics and activity data
- User preferences and settings
- Chat history

## Credits

- Animated icons by [Icons8](https://icons8.com)
- Equipment icons from [Noun Project](https://thenounproject.com) (CC BY 3.0)

## License

Private project - not for distribution.
