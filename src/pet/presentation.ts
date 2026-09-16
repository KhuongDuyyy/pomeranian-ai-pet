import { actionNames, type Action } from "./actions.js";
import type { Episode } from "./memory.js";
import type { Mood } from "./mood.js";

export type PetPose = "idle" | "walk" | "sleep" | "eat" | "play" | "affection";
export type PetMotion =
  "breathe" | "walk" | "sleep" | "eat" | "bounce" | "lean" | "alert";
export interface Presentation {
  pose: PetPose;
  motion: PetMotion;
  description: string;
  durationMs: number;
}

/** Visual seconds are deliberately separate from the core's simulated minutes. */
export const actionPresentation: Record<Action, Presentation> = {
  sleep: {
    pose: "sleep",
    motion: "sleep",
    description: "Cuộn tròn, nhắm mắt và thở đều.",
    durationMs: 16000,
  },
  rest: {
    pose: "sleep",
    motion: "sleep",
    description: "Nằm xuống nghỉ, thả lỏng bên chiếc đuôi bông.",
    durationMs: 12000,
  },
  explore: {
    pose: "walk",
    motion: "walk",
    description: "Bước quanh phòng, tò mò khám phá.",
    durationMs: 10000,
  },
  askFood: {
    pose: "idle",
    motion: "lean",
    description: "Nhìn về phía bát, chờ một bữa ăn.",
    durationMs: 8000,
  },
  eat: {
    pose: "eat",
    motion: "eat",
    description: "Cúi xuống bát, ăn từng miếng nhỏ.",
    durationMs: 10000,
  },
  bringToy: {
    pose: "play",
    motion: "walk",
    description: "Ngậm bóng, mang đến gần bạn.",
    durationMs: 10000,
  },
  play: {
    pose: "play",
    motion: "bounce",
    description: "Cúi người, nghịch bóng với vẻ thích thú.",
    durationMs: 12000,
  },
  seekOwner: {
    pose: "walk",
    motion: "walk",
    description: "Đi một vòng, tìm chỗ quen thuộc của bạn.",
    durationMs: 10000,
  },
  sitNearOwner: {
    pose: "affection",
    motion: "breathe",
    description: "Ngồi sát bên bạn, lim dim thư giãn.",
    durationMs: 10000,
  },
  requestAttention: {
    pose: "idle",
    motion: "lean",
    description: "Nghiêng đầu nhìn bạn, muốn được chú ý.",
    durationMs: 8000,
  },
  greetOwner: {
    pose: "idle",
    motion: "bounce",
    description: "Nhún nhảy vui mừng khi bạn trở về.",
    durationMs: 8000,
  },
  barkAlert: {
    pose: "idle",
    motion: "alert",
    description: "Khựng lại, chú ý về phía tiếng động.",
    durationMs: 6000,
  },
  lookAround: {
    pose: "idle",
    motion: "lean",
    description: "Nghiêng đầu, quan sát quanh phòng.",
    durationMs: 8000,
  },
  wander: {
    pose: "walk",
    motion: "walk",
    description: "Thong thả bước qua góc phòng.",
    durationMs: 10000,
  },
  headScratch: {
    pose: "affection",
    motion: "lean",
    description: "Nhắm mắt, nghiêng đầu đón nhận bàn tay bạn.",
    durationMs: 8000,
  },
};

export function getPresentation(
  episode: Episode | undefined,
  mood: Mood,
  now = Date.now(),
): Presentation & { active: boolean; key: string } {
  if (episode && actionNames.includes(episode.action as Action)) {
    const presentation = actionPresentation[episode.action as Action];
    const age = now - Date.parse(episode.at);
    // Reloads never replay old events; future timestamps cannot hold a pose forever.
    if (Number.isFinite(age) && age >= 0 && age < presentation.durationMs) {
      return {
        ...presentation,
        active: true,
        key: `${episode.at}:${episode.action}`,
      };
    }
  }
  const idle: Presentation =
    mood === "sleepy"
      ? {
          pose: "sleep",
          motion: "sleep",
          description: "Lim dim buồn ngủ, nằm cuộn mình thư giãn.",
          durationMs: 0,
        }
      : {
          pose: "idle",
          motion: "breathe",
          description:
            mood === "hungry"
              ? "Đứng chờ bên bát, có vẻ đang đói."
              : mood === "nervous"
                ? "Đứng yên quan sát, vẫn còn hơi cảnh giác."
                : "Đứng thư giãn, tò mò nhìn quanh.",
          durationMs: 0,
        };
  return { ...idle, active: false, key: `idle:${mood}` };
}

/** Rows/columns in the identity-preserving six-pose atlas. */
export const posePositions: Record<PetPose, string> = {
  idle: "0% 0%",
  walk: "50% 0%",
  sleep: "100% 0%",
  eat: "0% 100%",
  play: "50% 100%",
  affection: "100% 100%",
};
