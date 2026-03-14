# Canvas Manager

A React Native mobile app for managing Canvas LMS assignments and courses. Built with Expo and TypeScript.

## Features

- 📚 View all your courses
- 📝 Track assignments with due dates
-  Cross-platform (iOS/Android)
- 🎨 Clean, intuitive interface

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   
   Create a `.env` file in the root directory with your Canvas API credentials:
   ```env
   EXPO_PUBLIC_CANVAS_BASE_URL=https://your-canvas-instance.instructure.com/api/v1
   EXPO_PUBLIC_CANVAS_TOKEN=your_canvas_access_token
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## Getting Canvas API Access

1. Log into your Canvas instance
2. Go to Account Settings → Approved Integrations
3. Generate a new access token
4. Add the token to your `.env` file

## Building

- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

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
└── notificationService.ts # Push notification service

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
