/**
 * Memory Backend Registry
 * 
 * Manages available memory backends and provides factory for creation.
 */

import type { MemoryBackend, MemoryBackendConfig, MemoryBackendType } from './interface.js';

// Backend instances cache
const backendInstances = new Map<string, MemoryBackend>();

/**
 * Register a backend factory
 */
export function registerBackend(
  type: MemoryBackendType,
  factory: () => MemoryBackend
): void {
  backendFactories.set(type, factory);
}

const backendFactories = new Map<MemoryBackendType, () => MemoryBackend>();

/**
 * Get or create backend instance
 */
export async function getBackend(
  config: MemoryBackendConfig
): Promise<MemoryBackend> {
  const cacheKey = JSON.stringify(config);
  
  // Return cached instance if exists
  const cached = backendInstances.get(cacheKey);
  if (cached) {return cached;}
  
  // Create new instance
  const factory = backendFactories.get(config.type);
  if (!factory) {
    throw new Error(`Unknown memory backend type: ${config.type}`);
  }
  
  const backend = factory();
  await backend.initialize(config);
  
  // Cache instance
  backendInstances.set(cacheKey, backend);
  return backend;
}

/**
 * Clear backend cache (for testing/config changes)
 */
export function clearBackendCache(): void {
  backendInstances.clear();
}

/**
 * List available backend types
 */
export function listAvailableBackends(): MemoryBackendType[] {
  return Array.from(backendFactories.keys());
}
