/**
 * Empire 3-Layer Memory Backend
 * 
 * Premium backend with Knowledge / Daily / Tacit separation
 * Routes queries to appropriate layer for efficiency
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import _path from 'path'; // TODO: implement
import type { 
  MemoryBackend, 
  MemoryResult, 
  SearchOptions, 
  WriteOptions, 
  LayerInfo,
  EmpireMemoryConfig,
  MemoryLayer 
} from './interface.js';

export class EmpireMemoryBackend implements MemoryBackend {
  readonly id = 'empire' as const;
  readonly name = 'Empire 3-Layer';
  readonly description = 'Knowledge / Daily / Tacit layer separation';
  readonly isLayered = true;
  
  private config: EmpireMemoryConfig | null = null;
  
  async initialize(config: EmpireMemoryConfig): Promise<void> {
    // TODO: Validate license here
    this.config = config;
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<MemoryResult[]> {
    if (!this.config) {throw new Error('Backend not initialized');}
    
    const maxResults = options.maxResults || 5;
    const requestedLayers = options.layers;
    
    // Route query to appropriate layer(s)
    const layersToSearch = requestedLayers || this.routeQueryToLayers(query);
    
    const allResults: MemoryResult[] = [];
    
    for (const layer of layersToSearch) {
      const layerPath = this.getLayerPath(layer);
      const files = await glob('**/*.md', { cwd: layerPath, absolute: true });
      
      for (const file of files) {
        try {
          const content = await readFile(file, 'utf-8');
          const score = this.calculateScore(content, query);
          
          if (score > 0.3) {  // Threshold for relevance
            allResults.push({
              content: this.extractRelevantSnippet(content, query),
              path: file,
              score: score * this.getLayerPriority(layer),  // Boost by layer
              layer,
            });
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
    
    // Sort by score and return
    return allResults
      .toSorted((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
  
  async write(content: string, options: WriteOptions = {}): Promise<void> {
    // TODO: Implement write to appropriate layer
    console.log(`Write to ${options.layer || 'daily'}:`, content.slice(0, 50));
  }
  
  async getLayers(): Promise<LayerInfo[]> {
    if (!this.config) {throw new Error('Backend not initialized');}
    
    const layers: LayerInfo[] = [];
    
    for (const [id, path] of Object.entries(this.config.layers)) {
      const files = await glob('**/*.md', { cwd: path });
      
      layers.push({
        id: id as MemoryLayer,
        name: this.getLayerName(id as MemoryLayer),
        description: this.getLayerDescription(id as MemoryLayer),
        path,
        fileCount: files.length,
        lastUpdated: new Date(),  // TODO: Get actual last modified
      });
    }
    
    return layers;
  }
  
  /**
   * Route query to appropriate layer(s)
   */
  private routeQueryToLayers(query: string): MemoryLayer[] {
    const queryLower = query.toLowerCase();
    
    // Factual queries → Knowledge layer
    const factualPatterns = [
      /what is/, /who is/, /where is/, /when is/,
      /what's the/, /how to/, /definition/,
      /ip address/, /version/, /cost/, /price/
    ];
    
    for (const pattern of factualPatterns) {
      if (pattern.test(queryLower)) {
        return ['knowledge'];
      }
    }
    
    // Temporal queries → Daily layer
    const temporalPatterns = [
      /today/, /yesterday/, /this morning/, /last night/,
      /did we/, /what did/, /recent/, /last week/
    ];
    
    for (const pattern of temporalPatterns) {
      if (pattern.test(queryLower)) {
        return ['daily'];
      }
    }
    
    // Personal/agent queries → Tacit layer
    const personalPatterns = [
      /what do i/, /my preference/, /i like/, /i want/,
      /noemi/, /sir chad/, /agent/
    ];
    
    for (const pattern of personalPatterns) {
      if (pattern.test(queryLower)) {
        return ['tacit'];
      }
    }
    
    // Default: search all layers
    return ['knowledge', 'daily', 'tacit'];
  }
  
  private getLayerPath(layer: MemoryLayer): string {
    if (!this.config) {throw new Error('Not initialized');}
    return this.config.layers[layer];
  }
  
  private getLayerPriority(layer: MemoryLayer): number {
    // Boost scores based on layer priority
    switch (layer) {
      case 'knowledge': return 1.2;  // Facts are reliable
      case 'daily': return 1.0;      // Recent is good
      case 'tacit': return 0.9;      // Personal context
      default: return 1.0;
    }
  }
  
  private getLayerName(layer: MemoryLayer): string {
    const names = {
      knowledge: 'Knowledge Base',
      daily: 'Daily Logs',
      tacit: 'Agent Memory'
    };
    return names[layer];
  }
  
  private getLayerDescription(layer: MemoryLayer): string {
    const descriptions = {
      knowledge: 'Facts, entities, and verified information',
      daily: 'Daily activities and recent events',
      tacit: 'Agent preferences and learned behaviors'
    };
    return descriptions[layer];
  }
  
  private calculateScore(content: string, query: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);
    
    let matches = 0;
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {matches++;}
    }
    
    return matches / Math.max(keywords.length, 1);
  }
  
  private extractRelevantSnippet(content: string, query: string): string {
    // Simple extraction: find paragraph containing query terms
    const paragraphs = content.split(/\n\n/);
    const queryLower = query.toLowerCase();
    
    for (const paragraph of paragraphs) {
      if (paragraph.toLowerCase().includes(queryLower)) {
        return paragraph.slice(0, 500);  // Limit length
      }
    }
    
    return content.slice(0, 500);  // Fallback
  }
}

// Factory function
export function createEmpireMemoryBackend(): MemoryBackend {
  return new EmpireMemoryBackend();
}
