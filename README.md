# Skitii Health Tech

A comprehensive full-stack health monitoring application that integrates Bluetooth Low Energy (BLE) device connectivity with a modern web interface for tracking patient health data and managing health sessions.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Development](#development)
- [Project Architecture](#project-architecture)

## ✨ Features

- **User Authentication**: Secure JWT-based authentication system
- **Patient Management**: Create, update, and manage patient profiles
- **Health Sessions**: Track and manage patient health monitoring sessions
- **BLE Integration**: Connect to Bluetooth health monitoring devices (real and mock)
- **Heart Rate Monitoring**: Real-time heart rate data parsing and display
- **Real-time Status**: Connection status badge showing device connectivity
- **Responsive UI**: Modern React/Next.js frontend with Tailwind CSS styling
- **Session Controls**: Start, pause, and manage health monitoring sessions

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport
- **Validation**: class-validator and class-transformer
- **Security**: bcrypt for password hashing
- **API**: RESTful API with TypeScript

### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: CSS with component-based architecture
- **API Client**: Custom HTTP client with endpoint management
- **BLE Communication**: Custom BLE core with mock fallback
- **State Management**: React Context API

## 📁 Project Structure

```
skitii-health-app/
├── backend/                          # NestJS Backend Application
│   ├── src/
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       └── login.dto.ts
│   │   ├── patients/                 # Patient management module
│   │   │   ├── patients.controller.ts
│   │   │   ├── patients.service.ts
│   │   │   ├── patients.module.ts
│   │   │   ├── dto/
│   │   │   └── schemas/
│   │   │       └── patient.schema.ts
│   │   ├── sessions/                 # Health sessions module
│   │   │   ├── sessions.controller.ts
│   │   │   ├── sessions.service.ts
│   │   │   ├── sessions.module.ts
│   │   │   ├── dto/
│   │   │   └── schemas/
│   │   │       └── session.schema.ts
│   │   ├── app.module.ts             # Root application module
│   │   └── main.ts                   # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/                         # Next.js Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css           # Global styles
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx          # Patients list page
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Patient detail page
│   │   │   └── session/
│   │   │       └── [id]/
│   │   │           └── page.tsx      # Session detail page
│   │   ├── components/               # Reusable React components
│   │   │   ├── ConnectionBadge.tsx   # Device connection status
│   │   │   ├── PatientForm.tsx       # Patient form component
│   │   │   └── SessionControls.tsx   # Session control buttons
│   │   ├── lib/
│   │   │   ├── api-client.ts         # API client implementation
│   │   │   ├── auth-context.tsx      # Auth context provider
│   │   │   ├── api/
│   │   │   │   ├── client.ts         # HTTP client setup
│   │   │   │   ├── endpoints.ts      # API endpoint definitions
│   │   │   │   └── index.ts          # API exports
│   │   │   └── ble/
│   │   │       ├── ble-core.ts       # Core BLE functionality
│   │   │       ├── ble-mock.ts       # Mock BLE for testing
│   │   │       └── heart-rate-parser.ts  # Heart rate data parsing
│   │   └── next-env.d.ts             # Next.js type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── public/                       # Static assets
│
└── README.md                         # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **npm** or **yarn**: Package manager (included with Node.js)
- **MongoDB**: Local or cloud instance (e.g., MongoDB Atlas)
- **Git**: Version control system

### Recommended Tools
- **VS Code**: Recommended IDE
- **Postman** or **Thunder Client**: For API testing
- **MongoDB Compass**: GUI for MongoDB management

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd skitii-health-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with configuration
# Add the following variables:
# MONGODB_URI=mongodb://localhost:27017/skitii
# JWT_SECRET=your_secret_key_here
# PORT=3001

# Build the application
npm run build
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file (if needed for API configuration)
# Add the following variables:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

## ▶️ Running the Application

### Development Mode

#### Terminal 1 - Start MongoDB (if using local)
```bash
mongod
```

#### Terminal 2 - Start Backend
```bash
cd backend
npm run start:dev
```
The backend will run on `http://localhost:3001`

#### Terminal 3 - Start Frontend
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

### Production Mode

#### Build Backend
```bash
cd backend
npm run build
npm start
```

#### Build Frontend
```bash
cd frontend
npm run build
npm start
```

## 📡 API Overview

### Authentication Endpoints
- `POST /auth/login` - User login with credentials
- `POST /auth/register` - User registration

### Patient Endpoints
- `GET /patients` - Get all patients
- `GET /patients/:id` - Get patient by ID
- `POST /patients` - Create new patient
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Session Endpoints
- `GET /sessions` - Get all sessions
- `GET /sessions/:id` - Get session by ID
- `POST /sessions` - Create new session
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session

## 🔧 Development

### Backend Development Scripts

```bash
# Start in development mode with auto-reload
npm run start:dev

# Build for production
npm run build

# Start production build
npm start
```

### Frontend Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Code Standards

- Use TypeScript for type safety
- Follow NestJS architectural patterns in the backend
- Use React hooks and functional components in the frontend
- Maintain consistent naming conventions
- Write meaningful commit messages

## 🏗️ Project Architecture

### Backend Architecture
- **Modular Structure**: Organized into Auth, Patients, and Sessions modules
- **Service Layer**: Business logic separated in services
- **Controller Layer**: HTTP request handling in controllers
- **Schema/DTO Pattern**: Data validation and transformation
- **Guard Pattern**: JWT authentication guards for protected routes

### Frontend Architecture
- **Page-Based Routing**: Next.js file-based routing system
- **Component-Based UI**: Reusable React components
- **Context API**: Global state management for authentication
- **BLE Integration**: Abstraction layer for BLE device communication
- **API Client**: Centralized API communication layer

### Database Schema
- **Users**: Store user credentials and authentication info
- **Patients**: Patient profiles and demographics
- **Sessions**: Health monitoring sessions with timestamps and health data

## 🔐 Security Features

- JWT-based authentication for all protected routes
- Password hashing using bcrypt
- Request validation using class-validator
- TypeScript type safety throughout the application
- Environment variable configuration for sensitive data

## 📦 Dependencies Management

### Key Backend Dependencies
- `@nestjs/*`: NestJS framework packages
- `mongoose`: MongoDB ODM
- `passport-jwt`: JWT authentication strategy
- `bcrypt`: Password hashing
- `class-validator`: Data validation

### Key Frontend Dependencies
- `next`: React framework with SSR
- `react` & `react-dom`: UI library
- TypeScript: Type safety

## 📝 Notes

- The frontend includes BLE mock functionality for testing without physical devices
- Heart rate parsing is implemented for compatible BLE health devices
- The application uses MongoDB for data persistence
- JWT tokens are used for session management
