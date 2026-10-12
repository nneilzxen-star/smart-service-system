# SmartService Mobile

Native Android and iOS app for customer and technician accounts. It uses the same Express API and MySQL data as the web app; administrator and dispatcher screens remain web-only.

## Preview on a phone

1. Install Node.js 20.19 or newer and Expo Go on your Android or iPhone.
2. Start the project with `setup-windows.bat`, or from the project directory run `npm.cmd start -- --lan` inside `mobile`.
3. Connect your phone to the same Wi-Fi as the computer and scan the Expo QR code.
4. On the app sign-in screen, set **API server address** to `http://<computer-LAN-IP>:5000/api`. On Windows use `ipconfig`; on macOS find the active Wi-Fi address under **System Settings → Wi-Fi → Details**. The phone and computer must be on the same network. Allow Node.js through Windows Firewall on private networks, or permit local network connections if macOS prompts.
5. Register a customer or technician account, or sign in with an existing account.

For Android emulators, use `http://10.0.2.2:5000/api`; for an iOS simulator, use `http://localhost:5000/api`.

## Build installable binaries

Expo Go is for development previews. To build native apps without a local Android/iOS toolchain, configure an Expo Application Services (EAS) account and the required Apple/Google signing credentials. EAS cloud builds work from Windows; local iOS builds require macOS. Log in and create the EAS project once:

```powershell
npx.cmd eas-cli login
npx.cmd eas-cli build:configure
```

The `preview` profile builds an Android APK suitable for direct installation. The `production` profile builds store-ready bundles:

```powershell
npx.cmd eas-cli build --platform android --profile preview
npx.cmd eas-cli build --platform android --profile production
npx.cmd eas-cli build --platform ios --profile production
```

An iOS device build requires Apple signing and distribution credentials. Change the example app identifiers in `app.json` to identifiers owned by your Apple and Google developer accounts before store release. Use HTTPS for a production API. Do not expose the development database or RabbitMQ ports to the public internet.
