# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
- Always use `pnpm` instead of npm or yarn

### Common Commands
- `pnpm dev` - Start development server with custom server.mjs
- `pnpm build` - Build the Next.js application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm seed` - Seed database with initial data
- `pnpm security:init` - Initialize security system
- `pnpm security:clean` - Clean security system data

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Canvas**: Konva.js for 2D graphics and slide editor
- **Database**: SQLite with Prisma ORM
- **State Management**: Zustand stores
- **Internationalization**: next-intl (English/French)
- **Real-time**: Socket.io for live updates
- **Authentication**: Custom JWT-based auth
- **Scheduling**: node-cron for automated tasks

### Project Structure
- Feature-based architecture under `src/features/`
- Each feature contains: `api/`, `components/`, `hooks/`, `store/`, `types/`
- Shared components in `src/shared/`
- Custom server with Socket.io in `server.mjs`

### Key Features
1. **Slideshow Editor**: Konva-based canvas editor with shapes, text, images, videos
2. **Security System**: Accident tracking, indicators, and monitoring
3. **Scheduling**: Calendar-based slideshow scheduling with recurrence
4. **Live Panel**: Real-time slide display with Socket.io
5. **Media Management**: File upload with thumbnail generation
6. **Authentication**: Role-based access control

### Database Schema
- **Users**: Authentication and user preferences
- **Slideshows/Slides**: Content management with Konva JSON data
- **Media**: File storage with thumbnail support
- **Security**: Events, indicators, and monitoring dates
- **Scheduling**: Calendar events with recurrence patterns

## Coding Conventions

### Component Creation
- Use `export function` without default export
- Props directly typed in function parameter for ≤2 props
- Separate props type for >2 props
- Example: `export function MyComponent(props: { title: string; count: number })`

### File Naming
- Source files: `kebab-case.ts`
- React components: `PascalCase.tsx`
- Stores: `kebab-case.store.ts`
- API files: `kebab-case.api.ts`
- Hooks: `use[PascalCase].ts`

### Variable Naming
- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Booleans: `isValid`, `hasData` prefixes
- Classes: `PascalCase`
- Interfaces: `PascalCaseInterface`
- Types: `PascalCaseType`

### Editor Keyboard Shortcuts
- **Ctrl+C**: Copy selected elements
- **Ctrl+V**: Paste elements (offset by 20px)
- **Delete/Backspace**: Delete selected elements
- **Escape**: Deselect all elements
- **Ctrl/Cmd/Shift+Click**: Multi-select

## Important Implementation Details

### Konva Editor
- Uses React-Konva for canvas rendering
- Snapping system for object alignment
- Supports shapes, text, images, videos
- Persistent clipboard with visual indicators
- Transform controls with arrow keys

### State Management
- Zustand stores for each feature
- Immer for immutable state updates
- Persistent stores for user settings

### API Routes
- RESTful API under `/api/`
- JWT authentication middleware
- File upload handling with thumbnails
- Socket.io integration for real-time updates

### Security Features
- Accident tracking with severity levels
- Statistical indicators and monitoring
- Reference events for baseline comparison
- Automatic daily/monthly/yearly calculations

### Database Operations
- Prisma client generated in `prisma/generated/client`
- Migrations in `prisma/migrations/`
- SQLite database at `prisma/dev.db`
- Seed script for initial data

## Testing and Quality

### Linting
- ESLint configured with Next.js rules
- Run `pnpm lint` before commits

### Type Safety
- Strict TypeScript configuration
- Prisma-generated types for database
- Zod schemas for validation where needed