import { z } from "zod";
import { canAct, type Action } from "./pet/actions.js";
import { Pet } from "./pet/pet.js";
import { saveState } from "./pet/persistence.js";
import { bondProfile } from './pet/relationship.js';
import { learnedHabits } from './pet/habits.js';
import { currentActivity } from './pet/activity.js';

export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("observe") }).strict(),
  z.object({ type: z.literal("autonomy"), enabled: z.boolean() }).strict(),
  z
    .object({ type: z.literal("toy"), toy: z.enum(["blue_ball", "rope"]) })
    .strict(),
  z
    .object({
      type: z.literal("act"),
      action: z.enum(["play", "sleep", "rest", "sitNearOwner", "headScratch"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("feed"),
      food: z.enum(["kibble", "chicken"]).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("tick"),
      minutes: z.number().int().min(1).max(60),
    })
    .strict(),
  z
    .object({
      type: z.literal("context"),
      key: z.enum(["ownerPresent", "toyAvailable", "isNight"]),
      value: z.boolean(),
    })
    .strict(),
  z.object({ type: z.literal("noise") }).strict(),
  z
    .object({
      type: z.literal("rename"),
      name: z.string().trim().min(1).max(30),
    })
    .strict(),
]);
export type PetCommand = z.infer<typeof commandSchema>;
export function snapshot(pet: Pet) {
  const actions: Action[] = [
    "play",
    "sleep",
    "rest",
    "sitNearOwner",
    "headScratch",
  ];
  return {
    state: pet.state,
    context: pet.context,
    mood: pet.mood,
    bond: bondProfile(pet.state.relationship),
    habits: learnedHabits(pet.state.memory),
    activity: currentActivity(pet.state.memory),
    autonomy: { enabled: true, intervalSeconds: 20 },
    available: Object.fromEntries(
      actions.map((action) => [action, canAct(action, pet.state, pet.context)]),
    ),
  };
}
export type PetSnapshot = ReturnType<typeof snapshot>;

/** Serial transactions: publish state only after saving successfully. */
export class PetService {
  private queue: Promise<unknown> = Promise.resolve();
  private lastSeen = -Infinity;
  private nextTick = 0;
  private enabled = true;
  observe(now = Date.now()): PetSnapshot {
    if (now - this.lastSeen > 8000) this.nextTick = now + 20000;
    this.lastSeen = now;
    return this.read();
  }
  async pulse(now = Date.now()): Promise<void> {
    if (currentActivity(this.pet.state.memory, now)) return;
    if (!this.enabled || now - this.lastSeen > 8000 || now < this.nextTick)
      return;
    this.nextTick = now + 20000;
    await this.command({ type: "tick", minutes: 1 });
  }
  constructor(
    private pet: Pet,
    private readonly path: string,
    private readonly persist = saveState,
  ) {}
  read(): PetSnapshot {
    return structuredClone({
      ...snapshot(this.pet),
      autonomy: { enabled: this.enabled, intervalSeconds: 20 },
    });
  }
  command(input: PetCommand): Promise<PetSnapshot> {
    const result = this.queue.then(async () => {
      const command = commandSchema.parse(input);
      if (command.type === "observe") return this.observe();
      if (command.type === "autonomy") {
        this.enabled = command.enabled;
        this.nextTick = Date.now() + 20000;
        return this.read();
      }
      const next = new Pet(structuredClone(this.pet.state), {
        ...this.pet.context,
      });
      if (currentActivity(next.state.memory) && (command.type === 'act' || command.type === 'tick')) {
        throw new Error('Bôngg đang hoàn thành hoạt động. Chờ một chút nhé.');
      }
      switch (command.type) {
        case "act":
          next.act(command.action);
          break;
        case "feed":
          next.context.foodKind = command.food ?? "kibble";
          next.context.foodAvailable = true;
          break;
        case "toy":
          next.context.toyKind = command.toy;
          next.context.toyAvailable = true;
          break;
        case "tick":
          next.tick(command.minutes);
          break;
        case "noise":
          next.context.loudNoise = true;
          next.tick(0);
          break;
        case "rename":
          next.state.memory.profile.petName = command.name;
          break;
        case "context": {
          const wasPresent = next.context.ownerPresent;
          next.context[command.key] = command.value;
          if (command.key === "ownerPresent") {
            next.context.ownerJustArrived = command.value && !wasPresent;
            if (next.context.ownerJustArrived && !currentActivity(next.state.memory)) next.tick(0);
          }
          break;
        }
      }
      next.state.updatedAt = new Date().toISOString();
      await this.persist(this.path, next.state);
      this.pet = next;
      return this.read();
    });
    this.queue = result.catch(() => {});
    return result;
  }
}
