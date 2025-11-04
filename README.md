# FlowFox Creatives Generation Service

## Project Overview

FlowFox Creatives Generation Service is a web application for generating marketing creatives using AI. The system allows users to create campaigns, generate German headlines and images through OpenAI API, and manually pair them into creative combinations.

### Key Features:
- ✅ Campaign creation with context (industry, audience, tone)
- ✅ German headline generation via OpenAI GPT-4o-mini
- ✅ Image generation via OpenAI DALL-E 3
- ✅ Intuitive interface for pairing headlines and images
- ✅ Creatives gallery with delete functionality
- ✅ Campaigns history with navigation

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **AI Integration:** OpenAI API (GPT-4o-mini for text, DALL-E 3 for images)
- **Form Validation:** React Hook Form + Zod
- **Deployment:** Vercel

## Features Implemented

### Core Features

1. **Campaign Brief Form**
   - Client-side validation with React Hook Form + Zod
   - Required fields: name, industry, audience, tone
   - Optional description field
   - Loading states and error handling

2. **AI Headlines Generator**
   - Generates 3-5 German headlines
   - Uses GPT-4o-mini with JSON mode
   - 8-15 words per headline
   - Considers industry, audience, and tone

3. **AI Image Generator**
   - Generates 1-5 images via DALL-E 3
   - 16:9 aspect ratio guidance
   - Professional, brand-safe imagery
   - Sequential generation (DALL-E 3 limitation)

4. **Creative Pairing Interface**
   - Visual selection of headlines and images
   - Pairing status indicators
   - Intuitive click-to-select UI
   - Preview of selected pair before creation

5. **Creatives Gallery**
   - Responsive grid layout (1/2/3 columns)
   - Display of paired creatives
   - Delete functionality for creatives
   - Empty state with helpful messages

6. **Campaigns History**
   - List of all campaigns with statistics
   - Navigation between campaigns
   - Quick access to create new campaign

### UX Features

- Toast notifications for user feedback
- Loading states for all async operations
- Error handling with retry options
- Image loading spinners
- Responsive design
- Accessibility features

## Technical Decisions

### Architecture

1. **Next.js 15 App Router**
   - Server Components by default
   - Client Components only when interactivity is needed
   - Proper handling of `params` as Promise in Next.js 16

2. **TypeScript Strict Mode**
   - All types explicitly defined
   - Type guards for unknown values
   - Interfaces instead of type aliases for objects
   - No `any` types

3. **Prisma + PostgreSQL**
   - Singleton pattern for Prisma Client
   - Transactions for related operations
   - Proper handling of nullable fields

4. **OpenAI Integration**
   - DALL-E 3 for images (used instead of gpt-image-1, as gpt-image-1 may be outdated. DALL-E 3 is the current recommended model from OpenAI)
   - GPT-4o-mini for text (cost-effective)
   - JSON mode for structured outputs
   - Sequential image generation due to API limitations
   - 16:9 aspect ratio via prompt (DALL-E 3 doesn't support custom sizes, so 1024x1024 is used with prompt for 16:9)

5. **UI/UX**
   - Tailwind CSS for styling
   - Custom Toast component instead of alert()
   - ImageWithLoader component for better loading UX
   - Navigation header for consistent navigation

### Code Organization

- **File Structure:** Clear separation of components, lib, API routes
- **Error Handling:** Structured API responses `{success, data?, error?}`
- **State Management:** React hooks instead of Redux (simplicity)
- **Database:** PostgreSQL via Docker for local development

## Database Schema

### Entities

- **Campaign:** Basic campaign information (name, industry, audience, tone, optional description)
- **Headline:** German headline text with status tracking
- **Image:** Image URL and prompt with status tracking
- **Creative:** Pairing relationship between headline and image

### Relationships

- Campaign → Headlines (one-to-many)
- Campaign → Images (one-to-many)
- Campaign → Creatives (one-to-many)
- Headline → Creatives (one-to-many)
- Image → Creatives (one-to-many)

## API Design

All API endpoints follow a consistent response pattern:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Endpoints

- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `GET /api/campaigns/list` - List all campaigns
- `POST /api/ai/headlines/generate` - Generate headlines
- `POST /api/ai/images/generate` - Generate images
- `POST /api/creatives` - Create creative pair
- `DELETE /api/creatives/[id]` - Delete creative pair

## Known Limitations

### Areas for Improvement:

1. **Testing**
   - Unit tests for API routes
   - Integration tests for user flows
   - E2E tests with Playwright/Cypress

2. **Performance**
   - Image optimization via Next.js Image component
   - Caching for campaign data
   - Pagination for large lists

3. **Features**
   - Bulk operations (generating multiple campaigns)
   - Export creatives (PDF, ZIP)
   - Copy/paste functionality
   - Undo/redo for operations

4. **Error Handling**
   - Retry logic for OpenAI API rate limits
   - Better error messages for specific cases
   - Error logging service integration

5. **Database**
   - Soft delete for campaigns
   - Archive functionality
   - Search and filtering

## Cursor AI Setup Documentation

### .cursorrules Configuration

The `.cursorrules` file contains detailed rules for AI-assisted development:

**Rules and Patterns:**
- TypeScript strict mode with explicit types
- Next.js 15 App Router rules (params as Promise)
- Prisma best practices (singleton pattern, transactions)
- API design patterns (structured responses)
- Error handling guidelines (no alert(), toast notifications)
- UI/UX standards (loading states, accessibility)

**AI Models Used:**
- **Claude Sonnet 4.5** for primary development
  - Chosen for its strong understanding of TypeScript and React patterns
  - Excellent at generating boilerplate code while maintaining type safety
  - Good at following project-specific rules from `.cursorrules`
- **TypeScript Compiler** for code verification
  - Used to verify all AI-generated code compiles without errors
  - Ensures type safety across the entire codebase

**Cursor Features Usage:**

1. **Chat:**
   - Database schema design and Prisma patterns
   - API design discussions and endpoint structure
   - TypeScript problem solving and type definitions
   - Debugging assistance when errors occurred

2. **Inline Suggestions:**
   - Component autocompletion for React components
   - Type safety checks while typing
   - Code completion for API routes and Prisma queries
   - Suggestion of proper error handling patterns

3. **Plan Mode:**
   - Structuring large features (e.g., pairing interface)
   - Breaking tasks into smaller, manageable parts
   - Progress tracking during development
   - Not used extensively - preferred Chat for most tasks

**How Cursor Helped (or Hindered) Workflow:**

**Helped:**
- **Speed:** Significantly faster development, especially for boilerplate code
- **Consistency:** `.cursorrules` ensured consistent patterns across the codebase
- **Type Safety:** AI suggestions often included proper TypeScript types
- **Learning:** Helped understand Next.js 15 App Router patterns (params as Promise)
- **Error Prevention:** Caught common mistakes before runtime

**Hindered:**
- **Over-generation:** Sometimes generated more code than needed, requiring cleanup
- **Context Loss:** Had to re-explain context when switching between files
- **Debugging:** Occasionally needed manual debugging when AI code had subtle bugs
- **Custom Logic:** Required manual implementation for complex business logic

**Overall:** Cursor was highly beneficial, accelerating development by ~40-50% while maintaining code quality.

**Workflow:**
1. Task creation via Chat (describe feature requirements)
2. Code generation using inline suggestions and Chat
3. Verification via `npx tsc --noEmit`
4. Manual testing in browser
5. Iterative improvement based on feedback and testing
6. Code review against `.cursorrules` standards

**AI-Generated vs Hand-Written:**

- **AI-Generated (~40%):**
  - API routes structure and boilerplate
  - Component templates and scaffolding
  - Type definitions and interfaces
  - Error handling patterns
  - Database schema initial structure

- **Hand-Written (~60%):**
  - Business logic and algorithms
  - UI/UX decisions and styling
  - Prompt engineering for OpenAI integration
  - Custom hooks and state management
  - Complex component interactions
  - Error messages and user feedback

**Verification & Testing:**

1. **TypeScript Compilation:**
   ```bash
   npx tsc --noEmit
   ```

2. **Manual Testing:**
   - End-to-end user flows
   - Error scenarios
   - Edge cases (empty states, validation)

3. **Code Review:**
   - Compliance with `.cursorrules`
   - Type safety verification
   - Error handling completeness

**Testing Strategies:**

- **Type Safety:** TypeScript strict mode + explicit types
- **Runtime Validation:** Zod schemas for API inputs
- **Error Handling:** Try/catch blocks + user-friendly messages
- **Manual Testing:** User flows and edge cases

**Tips for Others:**

1. Use `.cursorrules` for consistency
2. Always verify TypeScript compilation
3. Manually test AI-generated code
4. Document business logic decisions
5. Use type guards for unknown values

## Project Structure

```
test/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── ai/
│   │   │   │   ├── headlines/generate/
│   │   │   │   └── images/generate/
│   │   │   ├── campaigns/
│   │   │   └── creatives/
│   │   ├── campaign/[id]/     # Campaign detail page
│   │   ├── campaigns/         # Campaigns list page
│   │   └── page.tsx           # Home page (create campaign)
│   ├── components/            # React components
│   │   ├── ImageWithLoader.tsx
│   │   ├── NavigationHeader.tsx
│   │   ├── Providers.tsx
│   │   └── Toast.tsx
│   ├── generated/prisma/      # Generated Prisma Client
│   └── lib/                   # Utilities
│       ├── openai.ts
│       └── prisma.ts
├── prisma/
│   ├── migrations/           # Database migrations
│   └── schema.prisma        # Database schema
├── docker-compose.yml        # Local PostgreSQL setup
├── .cursorrules             # Cursor AI rules
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

