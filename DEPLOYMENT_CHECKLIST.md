# Frontend Deployment Checklist

## Pre-Deployment

- [ ] All environment variables documented
- [ ] Build process tested locally (`npm run build`)
- [ ] Production build tested (`npm start`)
- [ ] API URL configured for production backend
- [ ] Feature flags configured (if needed)
- [ ] PWA icons generated
- [ ] No console errors in production build

## Environment Variables Required

### Required
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://your-backend.up.railway.app/api`)

### Optional (Feature Flags - default to true)
- `NEXT_PUBLIC_FEATURE_DASHBOARD` - `true`
- `NEXT_PUBLIC_FEATURE_APPOINTMENTS` - `true`
- `NEXT_PUBLIC_FEATURE_INVENTORY` - `true`
- `NEXT_PUBLIC_FEATURE_WORKER_COUNTS` - `true`
- `NEXT_PUBLIC_FEATURE_REPORTS` - `true`
- `NEXT_PUBLIC_FEATURE_CLIENTS` - `true`
- `NEXT_PUBLIC_FEATURE_ENGINEERS` - `true`
- `NEXT_PUBLIC_FEATURE_MATERIALS` - `true`
- `NEXT_PUBLIC_FEATURE_SETTINGS` - `true`

## Post-Deployment

- [ ] Test login functionality
- [ ] Verify API calls are working
- [ ] Test all major features
- [ ] Check PWA installation (if applicable)
- [ ] Verify responsive design
- [ ] Test on different browsers
- [ ] Check console for errors

## Build Commands

- Build: `npm run build`
- Start: `npm start`
- Dev: `npm run dev`

## Vercel Specific

- Framework: Next.js (auto-detected)
- Build Command: `npm run build` (auto-detected)
- Output Directory: `.next` (auto-detected)
- Install Command: `npm install` (auto-detected)

