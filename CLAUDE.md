# PayFlow Web

## Commands
- npm run dev | build | lint | test

## Stack
React 19 + TypeScript (strict), Vite, MUI, TanStack Query, react-router, axios, js-cookie

## Architecture (do not deviate)
- All HTTP goes through src/api/client.ts. Never import axios or use fetch elsewhere.
- One hook per endpoint in src/hooks/, each wrapping TanStack Query.
- Pages compose layout only. Feature components own their data via hooks.
- No component passes wallet ids around; the server resolves the wallet from the token.
- Every data component handles loading (Skeleton), error, and empty states.

## Contract
- The API contract is in ../payflow-api/docs/system-design.md section 4.
- Never invent an endpoint. If one is missing, stop and tell me.

## Rules
- No `any`. Follow the tokens in docs/design-system.md.
- Tests: Vitest + React Testing Library, mocking apiClient.
- Done = typecheck + lint + test all green.