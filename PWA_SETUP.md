# PWA Setup Guide

Your Next.js application is now configured as a Progressive Web App (PWA) and can be installed on mobile devices.

## What's Been Configured

1. **PWA Package**: `@ducanh2912/next-pwa` installed and configured
2. **Manifest File**: `public/manifest.json` with app metadata
3. **Icons**: Generated PWA icons in multiple sizes (192x192, 256x256, 384x384, 512x512)
4. **Service Worker**: Automatically generated on production build
5. **Meta Tags**: Added to `app/layout.tsx` for iOS and Android support

## Testing the PWA

### Development Mode
PWA features are **disabled** in development mode by default. To test PWA functionality:

1. Build the production version:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Access the app via HTTPS (required for PWA installation):
   - Use a tool like [ngrok](https://ngrok.com/) to create an HTTPS tunnel
   - Or deploy to a hosting service that provides HTTPS

### Installing on Mobile

#### Android (Chrome)
1. Open the app in Chrome browser
2. Tap the menu (three dots) → "Add to Home screen" or "Install app"
3. Confirm the installation
4. The app will appear on your home screen

#### iOS (Safari)
1. Open the app in Safari browser
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if needed and tap "Add"
5. The app will appear on your home screen

## Features Enabled

- ✅ Offline support (service worker caching)
- ✅ App-like experience (standalone display mode)
- ✅ Install prompt on supported browsers
- ✅ Fast navigation with front-end caching
- ✅ Automatic reload when coming back online

## Customization

### Icons
To replace the generated icons, update the PNG files in `public/`:
- `icon-192x192.png`
- `icon-256x256.png`
- `icon-384x384.png`
- `icon-512x512.png`

Then regenerate icons using:
```bash
npm run generate-icons
```

### Manifest
Edit `public/manifest.json` to customize:
- App name and description
- Theme colors
- Display mode
- Start URL

### PWA Configuration
Edit `next.config.ts` to adjust PWA settings like caching strategies, offline behavior, etc.

## Notes

- PWA installation requires HTTPS (except for localhost)
- Service worker is only active in production builds
- The app will work offline after the first visit (cached resources)

