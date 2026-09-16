import { createMemory, type Memory } from './memory.js';
import { initialStats, type Stats } from './stats.js';
import { initialRelationship, type Relationship } from './relationship.js';
export interface PetState { version: 1; stats: Stats; relationship: Relationship; memory: Memory; updatedAt: string; simulationMinutes: number; cooldowns: Record<string, number> }
export function createState(now = new Date().toISOString()): PetState {
  return { version: 1, stats: { ...initialStats }, relationship: { ...initialRelationship }, memory: createMemory(now), updatedAt: now, simulationMinutes: 0, cooldowns: {} };
}
