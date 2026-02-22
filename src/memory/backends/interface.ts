/**
 * Memory Backend Interface
 * 
 * Defines the contract for pluggable memory backends.
 * OpenClaw Default: Standard workspace/memory/ folder
 * Empire 3-Layer: Knowledge / Daily / Tacit separation
 * Custom: User-defined implementation
 */

export type MemoryBackendType = 'openclaw' | 'empire' | 'custom';

export type MemoryLayer = 'knowledge' | 'daily' | 'tacit';

export interface MemoryResult {
  content: string;
  path: string;
  score: number;
  layer?: MemoryLayer;  // For layered backends
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  maxResults?: number;
  layers?: MemoryLayer[];  // Filter by layer
  includeMetadata?: boolean;
}

export interface WriteOptions {
  layer?: MemoryLayer;
  metadata?: Record<string, unknown>;
}

export interface LayerInfo {
  id: MemoryLayer;
  name: string;
  description: string;
  path: string;
  fileCount: number;
  lastUpdated: Date;
}

export interface MemoryBackend {
  readonly id: MemoryBackendType;
  readonly name: string;
  readonly description: string;
  readonly isLayered: boolean;
  
  /**
   * Search memories
   */
  search(query: string, options?: SearchOptions): Promise<MemoryResult[]>;
  
  /**
   * Write memory entry
   */
  write(content: string, options?: WriteOptions): Promise<void>;
  
  /**
   * Get layer information (for layered backends)
   */
  getLayers?(): Promise<LayerInfo[]>;
  
  /**
   * Initialize backend with config
   */
  initialize(config: unknown): Promise<void>;
}

/**
 * Configuration for Empire 3-Layer backend
 */
export interface EmpireMemoryConfig {
  type: 'empire';
  license?: string;  // For premium validation
  layers: {
    knowledge: string;  // Layer 1: Facts, entities
    daily: string;      // Layer 2: Daily logs
    tacit: string;      // Layer 3: Agent wisdom
  };
}

/**
 * Configuration for OpenClaw default backend
 */
export interface OpenclawMemoryConfig {
  type: 'openclaw';
  path?: string;  // Defaults to workspace/memory
}

/**
 * Union type for all backend configs
 */
export type MemoryBackendConfig = EmpireMemoryConfig | OpenclawMemoryConfig | { type: 'custom'; [key: string]: unknown };
