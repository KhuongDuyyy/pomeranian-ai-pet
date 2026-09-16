import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { actionNames } from './actions.js';
import { createState, type PetState } from './state.js';
import { bondLevelForXp } from './relationship.js';
import { recoverKeepsakes } from './memory.js';
const value = z.number().min(0).max(100);
const date = z.iso.datetime();
const episode = z.object({ action: z.enum(actionNames), at: date, mood: z.enum(['hungry', 'sleepy', 'nervous', 'excited', 'playful', 'happy', 'neutral']), importance: value.optional() });
export const stateSchema = z.object({
  version: z.literal(1),
  simulationMinutes: z.number().nonnegative().default(0),
  cooldowns: z.record(z.string(), z.number().nonnegative()).default({}),
  stats: z.object({ hunger: value, energy: value, happiness: value, boredom: value, stress: value, sleepiness: value, health: value }),
  relationship: z.object({ affection: value, trust: value, familiarity: value, bondXp: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), bondLevel: z.number().int().positive() }).refine(r => r.bondLevel === 1 + Math.floor(r.bondXp / 25) || r.bondLevel === bondLevelForXp(r.bondXp), 'Invalid bond level').transform(r => ({ ...r, bondLevel: bondLevelForXp(r.bondXp) })),
  memory: z.object({
    profile: z.object({ ownerName: z.string().nullable(), petName: z.string().min(1), birthday: z.iso.date().nullable(), firstMet: date }),
    preferences: z.object({ favoriteToy: z.string(), favoriteFood: z.string(), dislikes: z.array(z.string()), learned: z.record(z.string(), value).default({}) }),
    episodic: z.array(episode).max(200), recent: z.array(episode).max(20),
    keepsakes: z.array(z.object({ key: z.string().min(1), title: z.string().min(1), at: date, importance: value })).max(50).optional(),
  }).transform(memory => ({ ...memory, keepsakes: memory.keepsakes ?? recoverKeepsakes([...memory.episodic, ...memory.recent]) })),
  updatedAt: date,
}) satisfies z.ZodType<PetState>;
export async function loadState(path: string): Promise<PetState> {
  let raw: string;
  try { raw = await readFile(path, 'utf8'); }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return createState();
    throw error;
  }
  try { return stateSchema.parse(JSON.parse(raw)); }
  catch (error) { throw new Error(`Invalid pet state at ${path}. Original file was preserved.`, { cause: error }); }
}
export async function saveState(path: string, state: PetState): Promise<void> {
  const validated = stateSchema.parse(state);
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(validated, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}
