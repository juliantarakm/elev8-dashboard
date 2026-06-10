import { vi } from 'vitest'

global.toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}
