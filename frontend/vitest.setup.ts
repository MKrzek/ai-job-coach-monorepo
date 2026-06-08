import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stabilise BASE_URL in tests
vi.stubEnv('VITE_API_URL', 'http://localhost:4111');

// jsdom doesn't implement scrollIntoView, so mock it for tests
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: vi.fn(),
});