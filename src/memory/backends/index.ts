/**
 * Memory Backends Index
 * 
 * Exports all backend implementations and registers them.
 */

export * from './interface.js';
export * from './registry.js';

import { registerBackend } from './registry.js';
import { createOpenclawDefaultBackend } from './openclaw-default.js';
import { createEmpireMemoryBackend } from './empire.js';

// Register built-in backends
registerBackend('openclaw', createOpenclawDefaultBackend);
registerBackend('empire', createEmpireMemoryBackend);
