/**
 * OpenClaw Default Memory Backend
 * 
 * Standard behavior: searches workspace/memory/ folder
 * This is the fallback when no specific backend is configured.
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import _path from 'path'; // TODO: implement
import type { MemoryBackend, MemoryResult, SearchOptions, WriteOptions, OpenclawMemoryConfig } from './interface.js';

export class OpenclawDefaultBackend implements MemoryBackend {
  readonly id = 'openclaw' as const;
  readonly name = 'OpenClaw Default';
  readonly description = 'Standard workspace/memory/ folder search';
  readonly isLayered = false;
  
  private basePath: string = '';
  
  async initialize(config: OpenclawMemoryConfig): Promise<void> {
    this.basePath = config.path || process.env.OPENCLAW_WORKSPACE || './memory';
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<MemoryResult[]> {
    const maxResults = options.maxResults || 5;
    
    // Find all markdown files
    const files = await glob('**/*.md', { 
      cwd: this.basePath,
      absolute: true 
    });
    
    // Search files (simple implementation)
    const results: MemoryResult[] = [];
    
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const score = this.calculateScore(content, query);
        
        if (score > 0) {
          results.push({
            content: content.slice(0, 1000),  // Truncate for preview
            path: file,
            score,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }
    
    // Sort by score and return top results
    return results
      .toSorted((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
  
  async write(content: string, options: WriteOptions = {}): Promise<void> {
    // TODO: Implement write to daily file
    // For now, this is a stub
    console.log('Write not implemented in default backend');
  }
  
  private calculateScore(content: string, query: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Simple keyword matching
    const keywords = queryLower.split(/\s+/);
    let matches = 0;
    
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        matches++;
      }
    }
    
    return matches / keywords.length;
  }
}

// Factory function for registry
export function createOpenclawDefaultBackend(): MemoryBackend {
  return new OpenclawDefaultBackend();
}
