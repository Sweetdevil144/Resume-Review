# Resume Review Platform - Technical Development Guide

## Project Overview

A simple resume submission and review platform built with Next.js and Supabase. The platform supports role-based access (Admin/User) for resume upload, status tracking, and manual review by admins.

## Technology Stack

- **Frontend**: Next.js 15.5.4 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **File Processing**: PDF.js for preview

---

## Phase 1: Database Schema Setup : DONE

### Objective

Initialize minimal PostgreSQL database schema in Supabase with only the tables needed for PS requirements.

### Database Tables

#### 1. `profiles`

- **Purpose**: User profile management with role-based access
- **Key Fields**: id (uuid, PK), email (unique), full_name, role (enum: user/admin)
- **Relationships**: One-to-many with submissions

#### 2. `submissions`

- **Purpose**: Resume submission tracking and metadata
- **Key Fields**: id (uuid, PK), user_id (FK), file_url, status (enum), score (nullable), admin_notes
- **Status Flow**: pending → approved/needs_revision/rejected
- **Relationships**: Belongs to profiles

### Database Setup Requirements

- Create tables with proper constraints and indexes
- Set up foreign key relationships
- Configure Row Level Security (RLS) policies
- Set up Supabase Storage bucket for resume files

## TODO : Optional later : email notification, AI review, leaderboard

---

## Phase 2: Authentication & Authorization Setup

### Objective

Implement secure authentication system with role-based access control using Supabase Auth.

### Authentication Features

- **Magic Link Authentication**: Passwordless login via email
- **Role Management**: Manual role assignment (user/admin)
- **Session Management**: Secure JWT-based sessions
- **Profile Creation**: Automatic profile creation on first login

### Authorization Levels

#### User Role

- Upload and manage own resume submissions
- View personal submission history and status

#### Admin Role

- Full access to all user submissions
- Manual score adjustment and status updates
- Add admin notes to submissions

### Security Implementation

- Row Level Security (RLS) policies for data isolation
- API route protection based on user roles
- Secure file upload with validation
- Input sanitization and validation

### Environment Variables

Add these to `.env.local` (for the Next.js app):

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Note: Do NOT commit secrets. The provided `.env` sample with `DATABASE_URL` is for server connectivity only; use the public keys above for the app.

### Routes and Middleware

- `middleware.ts` protects `/dashboard/**` and `/admin/**`, redirecting unauthenticated users to `/login`.
- `/login` sends a magic link.
- `/auth/callback` completes auth via `exchangeCodeForSession`.

### Utilities

- `lib/supabase/server.ts` – server client bound to Next cookies
- `lib/supabase/client.ts` – browser client

### Basic Pages

- `app/page.tsx` – landing with links
- `app/(auth)/login/page.tsx` – magic link form
- `app/dashboard/page.tsx` – gated user area
- `app/admin/page.tsx` – gated admin page with role check from `profiles`

---

## Phase 3: Backend Development

### Objective

Develop core backend functionality for file handling and basic operations.

### Core Backend Features

#### 3.1 File Upload System

- **PDF Validation**: File type, size, and content validation
- **Secure Storage**: Supabase Storage integration (bucket: `resumes`)
- **Signed URLs**: Store `file_url` as a signed URL valid for 7 days

### API Endpoints Structure

- **Submissions**:
  - `GET /api/submissions` – list current user's submissions
  - `POST /api/submissions` – multipart form-data with `file` to upload PDF and create submission
- **Admin**:
  - `GET /api/admin/submissions` – list latest submissions (admin only)
  - `PATCH /api/admin/submissions/:id` – update `status`, `score`, `admin_notes` (admin only)

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Notes:

- Client code uses `NEXT_PUBLIC_SUPABASE_*`. Server-only actions use `SUPABASE_SERVICE_ROLE_KEY` to upload to Storage.
- Ensure Storage bucket `resumes` exists in Supabase.

### Frontend Enhancements

- Client-side PDF preview (blob URL in an iframe) on the dashboard upload widget.
- Toast notifications via `components/ToastProvider` for success/error feedback.

---

## Phase 4: Frontend Implementation

### Objective

Create intuitive and responsive user interface with modern UX/UX design principles.

### Frontend Architecture

#### 4.1 Page Structure

- **Landing Page**: Public homepage with platform overview
- **Authentication**: Login/signup with magic link
- **User Dashboard**: Personal submission management
- **Admin Panel**: Administrative interface for reviewing submissions

#### 4.2 Component Architecture

- **Layout Components**: Header, navigation, footer
- **Form Components**: Upload forms, validation, error handling
- **Display Components**: Resume preview, status indicators
- **Interactive Components**: Drag-and-drop upload, progress bars
- **Data Components**: Tables, pagination

#### 4.3 User Experience Features

#### User Interface

- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **PDF Preview**: In-browser resume preview before submission
- **Status Tracking**: View submission status and admin feedback
- **Responsive Design**: Mobile-first approach with desktop optimization

#### Admin Interface

- **Submission Management**: View and filter all submissions
- **Score Adjustment**: Manual score modification interface
- **Status Updates**: Change submission status and add notes

#### 4.4 State Management

- **Authentication State**: User session and role management
- **Upload State**: File upload progress and validation
- **Data Fetching**: Efficient data loading and caching

#### 4.5 Performance Optimization

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Next.js Image component usage
- **Caching Strategy**: Efficient data caching and invalidation
- **Bundle Optimization**: Minimized JavaScript bundles

## Future Enhancements (Optional)

- AI-powered resume analysis
- Email notifications
- Leaderboard functionality
- Advanced analytics and reporting
- Mobile application development
