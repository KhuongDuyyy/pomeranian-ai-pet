import { clamp } from './stats.js';
export const initialRelationship = { affection: 20, trust: 10, familiarity: 5, bondXp: 0, bondLevel: 1 };
export type Relationship = typeof initialRelationship;
export const bondStages = ['Mới gặp', 'Quen thuộc', 'Bạn bè', 'Bạn thân', 'Gia đình', 'Bạn đồng hành', 'Tri kỷ'] as const;
export function bondLevelForXp(xp: number): number { return Math.min(7, 1 + Math.floor(xp / 25)); }
export function bondProfile(relationship: Relationship) {
  const level = bondLevelForXp(relationship.bondXp);
  return { level, name: bondStages[level - 1]!, nextName: bondStages[level] ?? null,
    nextXp: level < 7 ? level * 25 : null,
    progress: level < 7 ? relationship.bondXp % 25 : 25,
    unlocked: [
      ...(level >= 2 ? ['Nhận ra và mừng bạn trở về thân quen hơn'] : []),
      ...(level >= 3 ? ['Dễ bình tĩnh hơn khi được vuốt đầu'] : []),
      ...(level >= 4 ? ['Chủ động ngồi bên bạn thường xuyên hơn'] : []),
      ...(level >= 5 ? ['Cảm thấy an tâm hơn khi ở cạnh bạn'] : []),
      ...(level >= 6 ? ['Ưu tiên rủ bạn chơi món đồ quen thuộc'] : []),
      ...(level >= 7 ? ['Phản ứng gắn bó đặc biệt khi bạn trở về'] : []),
    ],
  };
}
export function bondReaction(action: string, level: number): string | null {
  if (action === 'greetOwner' && level >= 7) return 'Chạy về phía bạn, quấn quýt như gặp lại người thân nhất.';
  if (action === 'greetOwner' && level >= 2) return 'Nhận ra bạn, nhún nhảy mừng người quen trở về.';
  if (action === 'headScratch' && level >= 3) return 'Nhắm mắt, yên tâm nghiêng đầu áp vào bàn tay quen thuộc.';
  if (action === 'sitNearOwner' && level >= 5) return 'Ngồi sát bên bạn, thả lỏng hoàn toàn như đang ở nhà.';
  if (action === 'bringToy' && level >= 6) return 'Mang đồ chơi quen đến, háo hức chờ chơi cùng bạn.';
  return null;
}
export function bond(relationship: Relationship, affection = 0, trust = 0, xp = 0): void {
  relationship.affection = clamp(relationship.affection + affection);
  relationship.trust = clamp(relationship.trust + trust);
  relationship.familiarity = clamp(relationship.familiarity + 0.5);
  relationship.bondXp += xp;
  relationship.bondLevel = bondLevelForXp(relationship.bondXp);
}
