# Inventory Management System

A desktop inventory management application built with Electron, React, TypeScript, and SQLite.

## Tech Stack

- **Electron**: Desktop app framework
- **React + Vite**: Frontend framework and build tool
- **TypeScript**: Type-safe development
- **better-sqlite3**: SQLite database integration
- **Tailwind CSS**: Styling
- **React Router**: Client-side routing
- **Lucide React**: Icons

## Features

- User authentication with role-based access (Super Admin, Admin, Manager, Staff)
- Product management (add, edit, delete, search)
- Category management
- Stock in/out transactions with history
- Dashboard with statistics and recent transactions
- Low stock alerts
- Reports with export to CSV
- User management
- Settings and database backup
- Audit logging

## Default Credentials

- Username: `superadmin`
- Password: `Admin@1234`

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

To start the app in development mode:
```bash
npm run dev
```

### Build

To build the production version and package for Windows:
```bash
npm run build
```

The installer will be created in the `release` directory.

## Project Structure

```
inventory-app/
├── electron/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Preload script
│   ├── db/
│   │   ├── database.ts   # Database connection
│   │   └── schema.ts     # Database schema and seed
│   └── ipc/              # IPC handlers
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main app component
│   ├── index.css         # Global styles
│   ├── types/            # Type definitions
│   ├── context/          # React contexts (Auth, Toast)
│   ├── components/       # Reusable components
│   └── pages/            # Page components
└── Configuration files
```

## Security

- All database operations go through Electron IPC
- User roles are verified on the main process
- Passwords are hashed with bcrypt
- Context isolation enabled in Electron
