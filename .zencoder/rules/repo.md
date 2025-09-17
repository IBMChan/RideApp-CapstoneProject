---
description: Repository Information Overview
alwaysApply: true
---

# RideApp-CapstoneProject Information

## Summary
A ride-sharing application with multi-component architecture including frontend, backend services, and database systems.

## Structure
- **frontend/**: PHP-based web interface with views for admin, driver, and rider
- **backend/**: Multi-language backend with Node.js, Python, and C++ components
- **docs/**: Documentation including API docs and architecture diagrams
- **database/**: Database schemas for MySQL, PostgreSQL, MongoDB, and Redis

## Language & Runtime
**Languages**: JavaScript (Node.js), Python, C++, PHP
**Node.js Version**: ES Modules syntax (modern Node.js)
**Build System**: None specified
**Package Manager**: npm (implied from imports)

## Dependencies
**Main Dependencies**:
- express (Node.js web framework)
- mysql2/promise (MySQL client)
- sequelize (ORM)
- cookie-parser
- dotenv

## Database Systems
**Databases**:
- MySQL (user management, vehicle data)
- MongoDB (connection via mongoose implied)
- PostgreSQL (connection via pool)
- Redis (caching layer)

## Backend Components

### Node.js API Service
**Entry Point**: backend/node/app.js
**Architecture**: Express.js REST API with MVC pattern
**Routes**:
- /api/auth - Authentication
- /api/rides - Ride management
- /api/driver - Driver operations

### Python Services
**Components**:
- payments/ - Payment processing
- rides/ - Ride management

### C++ Component
**Purpose**: Ride matching algorithm
**File**: backend/cpp/matcher.cpp
**Functionality**: Matches riders with drivers based on distance

## Frontend
**Technology**: PHP
**Entry Point**: frontend/index.php
**Views**:
- admin.php - Admin dashboard
- driver.html - Driver interface
- rider.html - Rider interface

## Database Schema
**Main Tables**:
- users (authentication, user profiles)
- vehicles (vehicle registration and details)
- rides (ride tracking and management)

## Testing
No explicit testing framework identified.

## Deployment
Deployment scripts exist but are empty:
- docs/deploy.sh
- backend/scripts/deploy.sh