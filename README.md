# Smart Service Booking and Technician Dispatch System

Full-stack web and native mobile application for the **Systems Integration and Architecture** project.

SmartService connects customers, administrators/dispatchers, and technicians. Customers book services; admins dispatch technicians from the web app; technicians manage assigned jobs from the web or mobile app.

## Features

- Role-based customer, technician, and admin accounts
- Customer service booking, tracking, updates, cancellation, invoices, and reviews
- Technician job acceptance/rejection, status updates, service notes, earnings, and availability
- Native Android and iOS app for customers and technicians
- Web dashboards for all roles, including admin dispatch, reports, audit logs, and billing
- In-app notifications, transactional outbox, RabbitMQ retry and dead-letter processing
- Responsive React web app and JWT-protected API

## Technology

- Web: React 18, Vite, Tailwind CSS
- Mobile: React Native, Expo, React Navigation
- API: Node.js, Express
- Data: MySQL 8, RabbitMQ
- Authentication: JWT; mobile tokens stored in device secure storage

## Quick install on Windows

Requirements: Node.js 20.19 or newer and Docker Desktop. For mobile previews, install Expo Go on the Android or iPhone as well.

1. Copy or clone the project source to the PC. Never copy or share `backend/.env`; it contains machine-specific secrets. If copying the folder manually, omit that file so setup can create a fresh private configuration.
2. Install and start Docker Desktop and Node.js.
3. Double-click `setup-windows.bat`.

The setup creates a private backend JWT secret, installs backend/web/mobile dependencies, starts MySQL and RabbitMQ containers, then launches the API, web app, background workers, and Expo development server. The database schema and demo records initialize automatically the first time. Subsequent starts use the persisted Docker database volume and can be launched with `start.bat`.

The bundled MySQL container uses host port `3307` to avoid conflicts with an existing MySQL installation on port `3306`. Setup preserves an existing `backend/.env`; use its configured database if it points to an existing server, or omit that file when copying the source so setup can create a fresh configuration for the bundled database.

See [INSTALLATION.txt](./INSTALLATION.txt) for troubleshooting and manual setup.

## Quick install on macOS

Requirements: Node.js 20.19 or newer and Docker Desktop. Install those once, copy or clone the project source without `backend/.env`, then open Terminal in the project folder and run:

```bash
bash setup-mac.sh
```

The installer creates a private backend secret, installs all packages, starts the local MySQL/RabbitMQ containers and application servers, opens the web app, and displays the Expo QR code. Scan it with Expo Go on a phone on the same Wi-Fi. Press **Control-C** in Terminal to stop the app servers; the database and RabbitMQ containers keep running. On later launches run `bash scripts/start-mac.sh`. Setup details are in [INSTALLATION.txt](./INSTALLATION.txt).

## Open the apps

- Web app: `http://localhost:3000`
- API: `http://localhost:5000`
- API health check: `http://localhost:5000/api/health`
- RabbitMQ management UI: `http://localhost:15672`
- Mobile: scan the QR code shown in the Expo terminal using Expo Go.

The phone must be on the same network as the computer. Enter `http://<computer-LAN-IP>:5000/api` in the mobile sign-in screen. On Windows, use `ipconfig`; on macOS, find the active Wi-Fi address under **System Settings → Wi-Fi → Details**. Allow Node.js through Windows Firewall on private networks. More details and installable build guidance are in [mobile/README.md](./mobile/README.md).

The mobile app supports customer and technician roles only. Admin login, technician assignment, and system management remain web-only.

## Demo accounts

All demo accounts use password `Demo@1234`.

| Role | Email |
|---|---|
| Admin | `admin@smartservice.test` |
| Customer | `customer@smartservice.test` |
| Technician | `technician@smartservice.test` |

Change demo passwords before any deployment beyond a local demonstration.

## API and architecture

See [documentation/API.md](./documentation/API.md) for the REST API contract and [documentation/ARCHITECTURE.md](./documentation/ARCHITECTURE.md) for the architecture and design diagrams.

The existing Express API remains the system of record and is shared by the web and native clients. Booking state changes are transactional; notification/audit side effects use the outbox and RabbitMQ worker.

## Project structure

```text
smart-service-system/
├── backend/          # Express API, event worker, and publisher
├── database/         # MySQL schema, seed data, and migrations
├── documentation/    # API and architecture references
├── frontend/         # React web app, all roles
├── mobile/           # Expo Android/iOS app, customer and technician
├── scripts/          # First-run configuration helper
│   └── start-mac.sh  # Start and stop local app processes on macOS
├── setup-windows.bat # Install dependencies and start the system
├── setup-mac.sh      # Install dependencies and start the system on macOS
└── start.bat         # Start the system after setup
```

## Security and deployment

The bundled MySQL and RabbitMQ credentials are for local development only. Do not expose their ports to the public internet. Use HTTPS for a deployed API; do not send account credentials over plain HTTP on a public network. Configure production secrets and databases independently from the local Compose setup.
