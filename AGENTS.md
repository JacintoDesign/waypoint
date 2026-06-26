# Project Rules

## Stack
- Next.js 16 (App Router), React 19, TypeScript strict mode
- Supabase for database, auth, and storage
- Deploy target: Vercel

## Conventions
- Server Components by default; Client Components only when interactivity requires it
- All database access through typed query functions, never inline in components
- No `any`. If a type is unknown, model it.
- Environment variables typed and validated at startup, never read raw

## Working agreement
- Read CONTRACT.md before implementing any feature
- When a task is ambiguous, ask before building — do not assume
- Make the smallest change that satisfies the requirement
- After any multi-file change, summarise what changed and why