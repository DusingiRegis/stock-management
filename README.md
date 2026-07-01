# Cyuzuzo Inventory Management System

A desktop inventory management application built with Electron, React, TypeScript, and PostgreSQL.

## Tech Stack

- **Electron**: Desktop app framework
- **React + Vite**: Frontend framework and build tool
- **TypeScript**: Type-safe development
- **PostgreSQL**: Relational database
- **Tailwind CSS**: Styling
- **React Router**: Client-side routing
- **Lucide React**: Icons

## Features

- User authentication with role-based access (Super Admin, Admin, Manager, Staff)
- Multi-store management (create and switch between stores)
- Product management (add, edit, delete, search)
- Category management
- Stock in/out transactions with history
- Profit and Loss (P&L) tracking with date filtering
- Dashboard with statistics and recent transactions
- Low stock alerts
- Reports with export to CSV
- User management
- Settings and database configuration
- Audit logging

## Default Credentials

- Username: `superadmin`
- Password: `Admin@1234`

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL (v12 or later) installed and running locally

### Installation

1. **Install PostgreSQL:**
   - Download and install PostgreSQL from https://www.postgresql.org/download/
   - Make sure PostgreSQL is running on port 5432 (default)
   - Remember the `postgres` user password you set during installation

2. **Create the Database:**
   - Open psql (PostgreSQL command line) or pgAdmin
   - Create the inventory database:
     ```sql
     CREATE DATABASE inventory_db;
     ```
   - The default configuration uses:
     - Host: `localhost`
     - Port: `5432`
     - Database: `inventory_db`
     - User: `postgres`
     - Password: `admin123`
   - You can modify these settings later in the app's Settings page

3. **Install Dependencies:**
   ```bash
   cd inventory-app
   npm install
   ```

### Development

To start the app in development mode:
```bash
npm run dev
```

The first time you run the app, it will automatically:
- Create all database tables
- Seed default data (superadmin user, 2 stores, default settings)

### Build

To build the production version and package for Windows:
```bash
npm run build
```

To build for Mac:
```bash
npm run build:mac
```

The installer will be created in the `release` directory.

## Project Structure

```
inventory-app/
├── electron/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Preload script
│   ├── db/
│   │   ├── database.ts   # PostgreSQL connection and config
│   │   └── schema.ts     # Database schema and seed
│   └── ipc/              # IPC handlers (auth, products, stores, etc.)
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main app component
│   ├── index.css         # Global styles
│   ├── types/            # Type definitions
│   ├── context/          # React contexts (Auth, Toast, Store, Theme)
│   ├── components/       # Reusable components
│   └── pages/            # Page components
└── Configuration files
```

## Security

- All database operations go through Electron IPC
- User roles are verified on the main process
- Passwords are hashed with bcrypt
- Context isolation enabled in Electron
