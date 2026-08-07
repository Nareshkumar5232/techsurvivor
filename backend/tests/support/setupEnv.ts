// Runs before any test file's imports, so config/env.ts's Zod validation always sees a
// complete, valid (if fake) set of environment variables. config/firebaseAdmin.ts is mocked
// per test file (see fakeFirebaseAdmin.ts), so these Firebase values never touch a real SDK.
process.env.NODE_ENV = "test";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_CLIENT_EMAIL = "test@example.com";
process.env.FIREBASE_PRIVATE_KEY = "test-private-key";
process.env.COMPILER_PROVIDER = "mock";
process.env.LOG_LEVEL = "silent";
