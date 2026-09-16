import { clamp } from './stats.js';
export const initialRelationship = { affection: 20, trust: 10, familiarity: 5, bondXp: 0, bondLevel: 1 };
export type Relationship = typeof initialRelationship;
export function bond(relationship: Relationship, affection = 0, trust = 0, xp = 0): void {
  relationship.affection = clamp(relationship.affection + affection);
  relationship.trust = clamp(relationship.trust + trust);
  relationship.familiarity = clamp(relationship.familiarity + 0.5);
  relationship.bondXp += xp;
  relationship.bondLevel = 1 + Math.floor(relationship.bondXp / 25);
}
