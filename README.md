# Canvas Manager

Canvas Manager is a React Native/Expo TypeScript app for keeping track of Canvas LMS courses and assignments on mobile.

## Features

- View your current courses and jump straight to each one
- Track assignments due this week with urgency indicators
- Cross-platform (iOS, Android, and web) using Expo Router
- Minimal, responsive UI with themed components

## Prerequisites

- Node 18+ (or the version Expo 54 requires)
- npm 10+ (or your preferred package manager that works with Expo)
## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure the Canvas credentials**
   ```bash
   EXPO_PUBLIC_CANVAS_BASE_URL=https://your-canvas-instance.instructure.com/api/v1
   EXPO_PUBLIC_CANVAS_TOKEN=your_canvas_access_token
   ```
   Save these values in a `.env` file at the project root so Expo can pick them up at runtime.

3. **Run the app**
   ```bash
   npm start
   ```

## Getting Canvas API Access

1. Log into your Canvas instance
2. Go to Account Settings → Approved Integrations
3. Generate a new access token
4. Add the token to your `.env` file

## Available Scripts

- `npm start` — launches Expo Dev Tools for the selected platform.
- `npm run android` — builds and installs the app on a connected Android device or emulator.
- `npm run ios` — builds and installs the app on a connected iOS device or simulator.
- `npm run web` — runs the web version through Expo’s web bundler.
- `npm run lint` — runs `expo lint` to enforce coding standards.
- `npm run reset-project` — wipes and rebuilds native cache (useful when dependencies get out of sync).

## Testing

- `npm run lint` (spreadsheet of lint rules enforced by Expo).

## Project Structure

```
app/
├── _layout.tsx          # Root layout with theme provider
├── (tabs)/              # Tab-based navigation
│   ├── _layout.tsx      # Tab navigation setup
│   ├── index.tsx        # Home screen (assignments due this week)
│   ├── assignments.tsx  # Courses list
│   └── settings.tsx     # App settings
└── course/
    └── [id].tsx         # Course detail screen

components/
├── ui/                  # Platform-specific UI components
├── ThemedText.tsx       # Themed text component
├── ThemedView.tsx       # Themed view component
└── HapticTab.tsx        # Tab with haptic feedback

hooks/
├── useColorScheme.ts    # Theme detection
└── useThemeColor.ts     # Themed color utilities

utils/
└── canvasApi.tsx        # Canvas LMS API client

constants/
└── Colors.ts            # App color scheme
```

## Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and SDK
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based routing
- **AsyncStorage** - Local data persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

This project is licensed under the MIT License.
