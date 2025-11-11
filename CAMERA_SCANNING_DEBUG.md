# Camera Scanning Debug Guide

## What I Fixed

1. **Permission State Mismatch** ❌ → ✅
   - Was checking `hasPermission` (never set) instead of `permission` (from `useCameraPermissions`).
   - Now correctly checks `permission?.granted`.

2. **Missing Dependencies in useEffect** ❌ → ✅
   - `captureAndSend()` wasn't in the dependency array, causing stale closures.
   - Now properly includes `isCapturing` and `intervalMs`.

3. **Added Detailed Logging** 
   - Console logs at each step so you can see exactly what's happening:
     - When capturing starts/stops
     - When a photo is being captured
     - Photo base64 size
     - Server URL being called
     - OCR response or errors

## How to Verify It's Working

1. **Check Console Logs** (in Expo DevTools or Android Studio logcat):
   - Look for:
     ```
     Starting periodic capture every 3000 ms
     Triggering capture...
     Capturing photo...
     Photo captured, size: XXXX bytes
     Sending to: http://YOUR_SERVER_IP:5000/api/scan
     ```

2. **Verify Server is Reachable**:
   - Make sure `serverUrl` in `app/(tabs)/index.tsx` is set to a reachable IP.
   - Example: `http://192.168.1.42:5000/api/scan` (replace with your machine's LAN IP).
   - Test manually:
     ```bash
     curl -X POST http://YOUR_SERVER_IP:5000/api/health
     ```

3. **Start Your OCR Server**:
   - From your workspace:
     ```bash
     cd server
     npm install
     npm run dev
     ```
   - Confirm it logs: `OCR server listening on port 5000`

4. **Grant Camera Permission**:
   - When the app asks, tap **Allow** to grant camera permission.
   - Camera preview should appear (220px tall in the UI).

5. **Tap "Start scanning"**:
   - Button text should change to "Stop scanning".
   - Console should show `Starting periodic capture every 3000 ms`.
   - Every 3 seconds you should see logs like:
     ```
     Triggering capture...
     Capturing photo...
     Photo captured, size: XXXXX bytes
     Sending to: http://...
     ```

## Common Issues

| Issue | Fix |
|-------|-----|
| "No access to camera" message | Check device permissions in Settings > Apps > your-app > Permissions |
| "Initializing camera..." stuck | Camera permission might be denied; check device settings |
| Logs show "Camera ref not available" | `CameraView` failed to load; check console for render errors |
| "Capture/send error: Cannot reach server" | Update `serverUrl` to match your server's IP. Use `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your machine's LAN IP |
| Server logs show nothing | Confirm `serverUrl` is correct and server is running (`npm run dev`) |
| Server receives request but no MongoDB entry | Check `.env` has valid `MONGO_URI` and MongoDB is running/accessible |

## Next Steps

Once you verify:
- ✅ Camera permission granted
- ✅ "Start scanning" triggers logs
- ✅ Photos are captured (logs show size > 0)
- ✅ Server receives POST requests (server logs show requests)
- ✅ MongoDB has entries (check with `mongosh` or Compass)

Then the OCR + storage pipeline is complete! 🎉
