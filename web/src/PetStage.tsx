import { useEffect, useState } from "react";
import type { Episode } from "../../src/pet/memory.js";
import type { Mood } from "../../src/pet/mood.js";
import { getPresentation, posePositions } from "../../src/pet/presentation.js";
import { bondReaction } from '../../src/pet/relationship.js';

interface Props {
  name: string;
  mood: Mood;
  episode: Episode | undefined;
  night: boolean;
  toyKind: string;
  bondLevel: number;
}

export function PetStage({ name, mood, episode, night, toyKind, bondLevel }: Props) {
  const [now, setNow] = useState(Date.now);
  const [original, setOriginal] = useState(false);
  const [moving, setMoving] = useState(true);
  const [assetError, setAssetError] = useState(false);
  useEffect(() => {
    const image = new Image();
    image.src = "/assets/bongg-poses-v1.png";
    image.onerror = () => setAssetError(true);
    return () => {
      image.onerror = null;
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  const presentation = getPresentation(episode, mood, now);
  const reaction = presentation.active && episode ? bondReaction(episode.action, bondLevel) : null;
  const description = reaction ?? presentation.description;
  // The atlas includes a blue ball. Never show it as a rope interaction.
  const ropePlay = toyKind === "rope" && presentation.pose === "play";
  const pose = ropePlay ? "idle" : presentation.pose;
  return (
    <div className={`pet-stage ${night ? "stage-night" : ""}`}>
      <div className="stage-tools">
        <button aria-pressed={original} onClick={() => setOriginal(!original)}>
          {original ? "Xem Bôngg hoạt động" : "Xem ảnh chuẩn"}
        </button>
        <button
          aria-pressed={!moving}
          onClick={() => setMoving(!moving)}
          disabled={original || assetError}
        >
          {moving ? "Tắt chuyển động" : "Bật chuyển động"}
        </button>
      </div>
      {original || assetError ? (
        <div className="reference-portrait">
          <img
            src="/assets/pomeranian-reference.png"
            alt={`Ảnh chuẩn của ${name}, Pomeranian trắng lông bông, mắt tròn và đuôi cuộn`}
          />
        </div>
      ) : (
        <div className={`motion-space ${moving ? "" : "still"}`}>
          <div
            className={`motion-path motion-${presentation.motion}`}
            key={presentation.key}
          >
            <div
              className="pose-sprite"
              role="img"
              aria-label={`${name}: ${description}`}
              data-pose={pose}
              style={{ backgroundPosition: posePositions[pose] }}
            />
          </div>
          {pose === "sleep" && (
            <span className="sleep-sign" aria-hidden="true">
              z z z
            </span>
          )}
          {pose === "affection" && (
            <span className="affection-sign" aria-hidden="true">
              ♡
            </span>
          )}
        </div>
      )}
      <div className="stage-description" aria-live="polite">
        <strong>{name}</strong>
        <span>
          {original
            ? "Ảnh chuẩn được giữ nguyên để đối chiếu ngoại hình."
            : assetError
              ? "Chưa tải được bộ tư thế. Đang hiển thị ảnh chuẩn."
              : ropePlay
                ? "Nhún nhảy bên món đồ chơi quen thuộc."
                : description}
        </span>
      </div>
    </div>
  );
}
