import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { resolve } from 'node:path';
import { Pet } from './pet/pet.js';
import { loadState, saveState } from './pet/persistence.js';
import { rankActions } from './pet/decisionEngine.js';

const args = process.argv.slice(2);
function option(name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const result = args[index + 1];
  if (!result || result.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return result;
}
async function main(): Promise<void> {
  const path = resolve(option('--state', 'data/pet-state.json'));
  const steps = Number(option('--steps', '12'));
  if (!Number.isInteger(steps) || steps < 1 || steps > 10000) throw new Error('--steps must be an integer from 1 to 10000.');
  const pet = new Pet(await loadState(path));
  const show = () => console.log(JSON.stringify({ name: pet.state.memory.profile.petName, mood: pet.mood, stats: pet.state.stats, relationship: pet.state.relationship }, null, 2));
  const step = (minutes = 10) => console.log(`Action: ${pet.tick(minutes)} | Mood: ${pet.mood}`);
  console.log('White Pomeranian - AI Pet V1');
  if (!args.includes('--interactive')) {
    for (let i = 0; i < steps; i++) step();
    await saveState(path, pet.state);
    show();
    console.log(`Saved: ${path}`);
    return;
  }
  console.log('Commands: status, tick [minutes], food, play, sleep, pet, arrive, leave, noise, toy, night, scores, save, quit');
  const terminal = createInterface({ input: stdin, output: stdout });
  let closed = false;
  terminal.on('close', () => { closed = true; });
  const prompt = () => { if (stdin.isTTY && !closed) terminal.prompt(); };
  terminal.on('SIGINT', () => terminal.close());
  terminal.setPrompt('pet> ');
  prompt();
  try {
    for await (const line of terminal) {
      const [command, argument] = line.trim().split(/\s+/);
      if (command === 'quit' || command === 'exit') break;
      try {
        switch (command) {
          case 'status': show(); break;
          case 'tick': step(argument === undefined ? 10 : Number(argument)); break;
          case 'food': pet.context.foodAvailable = true; step(0); break;
          case 'play': console.log(pet.act('play')); break;
          case 'sleep': console.log(pet.act('sleep')); break;
          case 'pet': console.log(pet.act('sitNearOwner')); break;
          case 'arrive': pet.context.ownerPresent = true; pet.context.ownerJustArrived = true; step(0); break;
          case 'leave': pet.context.ownerPresent = false; pet.context.ownerJustArrived = false; break;
          case 'noise': pet.context.loudNoise = true; step(0); break;
          case 'toy': pet.context.toyAvailable = !pet.context.toyAvailable; console.log(pet.context); break;
          case 'night': pet.context.isNight = !pet.context.isNight; console.log(pet.context); break;
          case 'scores': console.table(rankActions(pet.state, pet.context, () => 0.5)); break;
          case 'save': break;
          case '': prompt(); continue;
          default: console.log('Unknown command. Use status, tick, food, play, sleep, pet, arrive, leave, noise, toy, night, scores, save, quit.');
        }
        await saveState(path, pet.state);
      } catch (error) { console.error(error instanceof Error ? error.message : error); }
      prompt();
    }
  } finally { terminal.close(); await saveState(path, pet.state); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
