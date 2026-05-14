# Frontend Roadmap

This document breaks the frontend work into clear phases so the UI can be built step by step against the current backend.

The recommended order is:

1. Authentication
2. App shell
3. Document management
4. Chat session management
5. Chat panel
6. Polish and refinement

This order works well because:

- chat depends on documents
- documents depend on authenticated users
- protected pages depend on auth state
- it lets each phase be tested before moving on

## Product Goal

The frontend should help users:

1. create an account and log in
2. upload PDF documents
3. wait for document processing
4. browse their uploaded documents
5. create chat sessions tied to a document
6. ask questions and receive document-grounded answers

The product should feel like a document intelligence workspace, not just a generic chatbot.

## Backend API Groups

Base path: `/api/v1`

Main API groups used by the frontend:

- `auth`
- `documents`
- `chat-sessions`
- `health`

## Phase 1: Authentication

Goal: let users enter the app securely and keep their session active.

### Features

1. Signup page
   - Form fields:
     - `full_name`
     - `email`
     - `password`
   - API:
     - `POST /api/v1/auth/signup`

2. Login page
   - Form fields:
     - `email`
     - `password`
   - API:
     - `POST /api/v1/auth/login`

3. Token handling
   - store access token
   - attach bearer token to protected requests
   - support token refresh
   - API:
     - `POST /api/v1/auth/refresh`

4. Restore logged-in user on app load
   - load current user profile after refresh or page reload
   - API:
     - `GET /api/v1/auth/me`

5. Logout
   - clear local auth state
   - revoke current session
   - API:
     - `POST /api/v1/auth/logout`

6. Session management screen
   - show active sessions/devices
   - API:
     - `GET /api/v1/auth/sessions`

### Screens

- Signup
- Login
- Profile or account page
- Active sessions page

### UI States

- loading during signup/login
- invalid credentials
- email already exists
- token expired
- unauthenticated redirect
- successful logout

### Deliverables

- working signup flow
- working login flow
- auth state management
- protected API client
- logout flow

## Phase 2: App Shell

Goal: create the reusable structure of the app before adding the main product features.

### Features

1. Protected routes
2. Sidebar navigation
3. Top bar
4. User profile menu
5. Global toast/error system
6. Shared loading and error states
7. Reusable API layer with auth headers

### Suggested Navigation

- Documents
- Chats
- Profile
- Sessions
- Logout

### Layout Recommendation

- left sidebar for primary navigation
- top bar for page title and user actions
- main content area for documents and chat
- utility area for alerts, status, and actions

### Deliverables

- authenticated dashboard shell
- route guards
- reusable layout components
- shared feedback system

## Phase 3: Document Management

Goal: allow users to upload, view, and track their PDFs.

### Features

1. Document list page
   - API:
     - `GET /api/v1/documents/`

2. Upload document flow
   - file picker or drag and drop
   - optional title field
   - API:
     - `POST /api/v1/documents/upload`

3. Document detail page
   - API:
     - `GET /api/v1/documents/{document_id}`

4. Processing status handling
   - upload in progress
   - processing
   - processed
   - failed

### Screens

- Documents list
- Upload modal or upload page
- Document detail page

### UI Components

- upload zone
- document card or table row
- processing status badge
- empty state
- error banner
- document detail header

### Important UX Rules

- only show `Start Chat` for processed documents
- clearly separate failed documents from ready documents
- show useful feedback after upload

### Deliverables

- working upload UI
- working document list
- working document detail screen
- clear status-driven UI

## Phase 4: Chat Session Management

Goal: let users create and organize chats for each processed document.

### Features

1. Create chat session
   - API:
     - `POST /api/v1/chat-sessions/`

2. List chat sessions
   - API:
     - `GET /api/v1/chat-sessions/`

3. Open a single chat session
   - API:
     - `GET /api/v1/chat-sessions/{chat_id}`

### Screens

- Chat session list
- Chat session detail shell

### UX Ideas

- create chat directly from a processed document
- show document name attached to each chat
- show last updated time
- show active/inactive status if needed

### Deliverables

- create-chat action from document view
- chat list page
- session detail route

## Phase 5: Chat Panel

Goal: build the core AI chat experience around a processed PDF.

### Features

1. Chat history view
2. Message composer
3. Send-message flow
   - API:
     - `POST /api/v1/chat-sessions/{chat_id}/messages`

4. Assistant response display
5. Source or citation display
6. Loading state while answer is being generated

### Suggested Layout

- left panel:
  - chat sessions
- center panel:
  - message history
  - input box
- right panel or expandable drawer:
  - sources
  - supporting snippets
  - document references

### UI States

- sending message
- assistant loading
- no supporting sources
- backend error
- linked document not ready
- inactive chat session

### Deliverables

- working chat screen
- message composer
- answer rendering
- source-aware response panel

## Phase 6: Polish and Refinement

Goal: make the app feel intentional, premium, and easier to use.

### Enhancements

1. Skeleton loaders
2. Empty states
3. Error recovery UI
4. Smooth page and panel transitions
5. Search and filtering
6. Better mobile responsiveness
7. Upload success and failure feedback
8. Improved visual hierarchy for document and source context

### Design Direction Suggestions

- avoid making it look like a generic chatbot
- make uploaded documents the center of the experience
- use strong typography and clear visual hierarchy
- highlight processing states and source-grounded answers
- make citations feel trustworthy and easy to inspect

## Recommended Build Sequence

Use this exact order when implementing:

1. Signup page
2. Login page
3. Auth state and token handling
4. Protected app shell
5. Document list page
6. Upload document flow
7. Document detail page
8. Create chat session flow
9. Chat session list page
10. Chat panel
11. Source and citation UI
12. Polish and responsive behavior

## Suggested Frontend Folder Direction

If using React or Next.js, a clean feature-based structure would be:

- `features/auth`
- `features/documents`
- `features/chat`
- `components/layout`
- `components/ui`
- `lib/api`
- `lib/auth`
- `hooks`

## Implementation Notes

- build the frontend around backend states, not just happy paths
- keep auth concerns separate from document and chat features
- make document readiness very visible before allowing chat
- treat source display as a first-class experience
- use this roadmap as a checklist and move to the next phase only when the current one is testable

## Quick Checklist

- Phase 1 complete: users can sign up, log in, stay logged in, and log out
- Phase 2 complete: protected shell and navigation exist
- Phase 3 complete: users can upload and inspect documents
- Phase 4 complete: users can create and open chat sessions
- Phase 5 complete: users can ask questions and read responses with sources
- Phase 6 complete: the product feels polished and responsive
