import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PetCommand, PetSnapshot } from "../../src/webApi.js";
import { PetStage } from "./PetStage";
import { bondProfile, bondStages } from '../../src/pet/relationship.js';
import { currentActivity } from '../../src/pet/activity.js';

import "./style.css";

const moods: Record<string, string> = {
  hungry: "Đang đói bụng",
  sleepy: "Buồn ngủ rồi",
  nervous: "Hơi lo lắng",
  excited: "Rất hào hứng",
  playful: "Muốn chơi cùng bạn",
  happy: "Đang vui vẻ",
  neutral: "Thật bình yên",
};
const actions: Record<string, string> = {
  headScratch: "Nghiêng đầu áp vào tay, đón nhận vuốt ve",
  sleep: "Ngủ một giấc thật ngon",
  rest: "Nghỉ ngơi một chút",
  explore: "Khám phá quanh nhà",
  askFood: "Nhắc bạn rằng mình đói rồi",
  eat: "Ăn một bữa ngon",
  bringToy: "Mang đồ chơi đến cho bạn",
  play: "Chơi đùa cùng bạn",
  seekOwner: "Đi tìm bạn",
  sitNearOwner: "Ngồi cạnh bạn, cảm thấy được yêu",
  requestAttention: "Muốn được bạn chú ý",
  greetOwner: "Mừng bạn trở về",
  barkAlert: "Sủa khi nghe tiếng động",
  lookAround: "Tò mò nhìn xung quanh",
  wander: "Đi dạo quanh phòng",
};
const statLabels = {
  hunger: "Đói bụng",
  energy: "Năng lượng",
  happiness: "Niềm vui",
  boredom: "Buồn chán",
  stress: "Căng thẳng",
  sleepiness: "Buồn ngủ",
  health: "Sức khỏe",
};

async function request(command?: PetCommand): Promise<PetSnapshot> {
  const response = await fetch(
    command ? "/api/command" : "/api/pet",
    command
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        }
      : { cache: "no-store" },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Không kết nối được với pet.");
  return data as PetSnapshot;
}
function App() {
  const [pet, setPet] = useState<PetSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const refresh = async () => {
    try {
      setPet(await request());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải pet.");
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const poll = async () => {
      if (document.hidden || inFlight || busy) return;
      inFlight = true;
      try {
        const next = await request({ type: "observe" });
        if (active)
          setPet((current) =>
            !current || next.state.updatedAt >= current.state.updatedAt
              ? next
              : current,
          );
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Mất kết nối với pet.");
      } finally {
        inFlight = false;
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [busy]);
  async function send(command: PetCommand) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await request(command);
      setPet(next);
      const last = next.state.memory.recent.at(-1);
      setNotice(
        command.type === "rename"
          ? "Đã lưu tên mới."
          : command.type === "context" ||
              command.type === "toy" ||
              command.type === "autonomy"
            ? "Đã cập nhật căn phòng."
            : command.type === "feed" && next.context.foodAvailable
              ? "Đồ ăn đã sẵn sàng. Pet sẽ ăn khi đói."
              : last
                ? (actions[last.action] ?? last.action)
                : "Đã lưu.",
      );
      if (command.type === "rename") setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác chưa thành công.");
    } finally {
      setBusy(false);
    }
  }
  if (!pet)
    return (
      <main className="loading">
        <span className="brand-icon">✦</span>
        <h1>Một người bạn nhỏ đang đợi…</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => void refresh()}>Thử kết nối lại</button>
          </>
        ) : (
          <p>Đang mở căn phòng của pet.</p>
        )}
      </main>
    );
  const { state, context, mood, available } = pet;
  const bond = pet.bond ?? bondProfile(state.relationship);
  const activity = currentActivity(state.memory, clock);
  const petName = state.memory.profile.petName;
  const minutes = Math.floor(state.simulationMinutes);
  const controls: {
    label: string;
    symbol: string;
    hint: string;
    command: PetCommand;
    enabled: boolean;
  }[] = [
    {
      label: "Cho ăn",
      symbol: "◡",
      hint: context.foodAvailable ? "Bát đã có đồ ăn" : "Một bữa ngon",
      command: { type: "feed", food: context.foodKind as "kibble" | "chicken" },
      enabled: !context.foodAvailable,
    },
    {
      label: "Chơi cùng",
      symbol: "⚽",
      hint: !context.ownerPresent
        ? "Cần bạn ở nhà"
        : !context.toyAvailable
          ? "Cần có đồ chơi"
          : state.stats.energy < 20
            ? "Cần thêm năng lượng"
            : "10 phút vui vẻ",
      command: { type: "act", action: "play" },
      enabled: !!available.play,
    },
    {
      label: "Vuốt ve",
      symbol: "♡",
      hint: context.ownerPresent ? "Vuốt nhẹ lên đầu" : "Cần bạn ở nhà",
      command: { type: "act", action: "headScratch" },
      enabled: !!available.headScratch,
    },
    {
      label: "Nghỉ ngơi",
      symbol: "☁",
      hint: available.rest ? "Thư giãn 15 phút" : "Pet vẫn đầy sức",
      command: { type: "act", action: "rest" },
      enabled: !!available.rest,
    },
    {
      label: "Đi ngủ",
      symbol: "☾",
      hint: available.sleep ? "Một giấc 60 phút" : "Chưa buồn ngủ",
      command: { type: "act", action: "sleep" },
      enabled: !!available.sleep,
    },
  ];
  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="/" aria-label="Trang chủ">
          <span className="brand-icon">✦</span> little companion
          <span className="version">PET LAB / 01</span>
        </a>
        <span className="save-state">
          <i />{" "}
          {busy
            ? "Đang lưu…"
            : error
              ? "Cần kiểm tra kết nối"
              : "Đã lưu trên máy"}
        </span>
      </header>
      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">MỘT GÓC NHỎ, MỘT NGƯỜI BẠN</p>
            <h1>Ở đây có {petName}.</h1>
            <p>Một chút quan tâm. Một ngày thật vui.</p>
          </div>
          <div className="clock">
            <span>THỜI GIAN BÊN NHAU</span>
            <strong>
              {Math.floor(minutes / 60)}
              <small> giờ </small>
              {minutes % 60}
              <small> phút</small>
            </strong>
            <span>thời gian mô phỏng</span>
          </div>
        </section>
        <div className="dashboard">
          <div className="left-column">
            <section
              className={`room ${context.isNight ? "night" : ""}`}
              aria-label="Căn phòng của pet"
            >
              <div className="room-top">
                <span className="pill">
                  <i />
                  {moods[mood]}
                </span>
                <button
                  className="day-toggle"
                  disabled={busy}
                  onClick={() =>
                    void send({
                      type: "context",
                      key: "isNight",
                      value: !context.isNight,
                    })
                  }
                >
                  {context.isNight ? "☾ Ban đêm" : "☀ Ban ngày"}
                </button>
              </div>
              <PetStage
                name={petName}
                mood={mood}
                episode={state.memory.recent.at(-1)}
                night={context.isNight}
                toyKind={context.toyKind}
                bondLevel={bond.level}
              />
              <div className="room-bottom">
                <span>
                  ⌂{" "}
                  {context.ownerPresent
                    ? "Bạn đang ở nhà"
                    : "Bạn đang ra ngoài"}
                </span>
                <span>
                  {context.foodAvailable ? "Bát đã có đồ ăn" : "Bát đang trống"}
                </span>
              </div>
            </section>
            <section className="care card">
              <div className="section-heading">
                <h2>Dành chút thời gian cho nhau</h2>
                {activity && <div role="status"><p>{actions[activity.action]} · còn {Math.ceil((activity.endsAt - clock) / 1000)} giây</p><progress aria-label="Tiến trình hoạt động" max={1} value={activity.progress} /></div>}
                <span>CHĂM SÓC</span>
              </div>
              <div className="care-actions">
                {controls.map((control) => (
                  <button
                    key={control.label}
                    disabled={busy || !control.enabled || (!!activity && control.command.type === 'act')}
                    onClick={() => void send(control.command)}
                    title={control.hint}
                  >
                    <span className="action-symbol">{control.symbol}</span>
                    <strong>{control.label}</strong>
                    <small>{control.hint}</small>
                  </button>
                ))}
              </div>
              <div className="feedback" aria-live="polite">
                {busy
                  ? "Đang chăm sóc và lưu tiến trình…"
                  : notice ||
                    "Chọn một hành động để bắt đầu. Pet sẽ phản ứng theo trạng thái hiện tại."}
              </div>
            </section>
            <section className="card environment">
              <div className="section-heading">
                <h2>Nhịp sống trong phòng</h2>
                <span>MÔI TRƯỜNG</span>
              </div>
              <div className="environment-controls">
                <button
                  disabled={busy}
                  onClick={() =>
                    void send({
                      type: "autonomy",
                      enabled: !pet.autonomy.enabled,
                    })
                  }
                >
                  {pet.autonomy.enabled ? "Tạm dừng tự động" : "Bật tự động"}
                </button>
                <label>
                  Món ăn{" "}
                  <select
                    value={context.foodKind}
                    disabled={busy || context.foodAvailable}
                    onChange={(e) =>
                      void send({
                        type: "feed",
                        food: e.target.value as "kibble" | "chicken",
                      })
                    }
                  >
                    <option value="kibble">Hạt</option>
                    <option value="chicken">Gà</option>
                  </select>
                </label>
                <label>
                  Đồ chơi{" "}
                  <select
                    value={context.toyKind}
                    disabled={busy}
                    onChange={(e) =>
                      void send({
                        type: "toy",
                        toy: e.target.value as "blue_ball" | "rope",
                      })
                    }
                  >
                    <option value="blue_ball">Bóng xanh</option>
                    <option value="rope">Dây kéo</option>
                  </select>
                </label>
                <button
                  aria-pressed={context.ownerPresent}
                  disabled={busy}
                  onClick={() =>
                    void send({
                      type: "context",
                      key: "ownerPresent",
                      value: !context.ownerPresent,
                    })
                  }
                >
                  {context.ownerPresent ? "↗ Ra ngoài" : "⌂ Về nhà"}
                </button>
                <button
                  aria-pressed={context.toyAvailable}
                  disabled={busy}
                  onClick={() =>
                    void send({
                      type: "context",
                      key: "toyAvailable",
                      value: !context.toyAvailable,
                    })
                  }
                >
                  {context.toyAvailable ? "Cất đồ chơi" : "Lấy đồ chơi"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => void send({ type: "noise" })}
                >
                  Tạo tiếng động
                </button>
              </div>
              <div className="time-row">
                <div>
                  <strong>
                    {pet.autonomy.enabled
                      ? "Pet đang tự hoạt động"
                      : "Pet đang tạm nghỉ"}
                  </strong>
                  <p>
                    Mỗi 20 giây: trôi 1 phút mô phỏng rồi pet tự chọn hành động.
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={busy || !!activity}
                  onClick={() => void send({ type: "tick", minutes: 10 })}
                >
                  {activity ? 'Đang hoàn thành hoạt động' : '+10 phút'} <span>→</span>
                </button>
              </div>
            </section>
          </div>
          <aside>
            <section className="card profile">
              <div className="profile-top">
                <div className="avatar">
                  {petName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2>{petName}</h2>
                  <p>Người bạn Pomeranian của bạn</p>
                </div>
                <button
                  className="edit"
                  aria-label="Đổi tên pet"
                  onClick={() => {
                    setName(petName);
                    setEditing(!editing);
                  }}
                >
                  ✎
                </button>
              </div>
              {editing && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send({ type: "rename", name });
                  }}
                >
                  <label htmlFor="pet-name">Tên của pet</label>
                  <div className="rename">
                    <input
                      id="pet-name"
                      maxLength={30}
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                    <button disabled={busy || !name.trim()} type="submit">
                      Lưu
                    </button>
                  </div>
                </form>
              )}
              <div className="bond">
                <span>♡ {bond.name} · Cấp {bond.level}</span>
                <strong>{bond.nextXp === null ? 'Mốc cao nhất' : `${bond.progress}/25 XP`}</strong>
              </div>
              <progress
                value={bond.progress}
                max={25}
                aria-label="Tiến độ gắn bó"
              />
              <p className="bond-note">
                {bond.nextXp === null ? `Đã cùng nhau tích lũy ${state.relationship.bondXp} XP. Vẫn tiếp tục tạo kỷ niệm mới.` : `Còn ${bond.nextXp - state.relationship.bondXp} XP để trở thành ${bond.nextName?.toLowerCase()}.`}
              </p>
              <div className="relationship-values">
                <span>Tình cảm <strong>{Math.round(state.relationship.affection)}</strong></span>
                <span>Tin cậy <strong>{Math.round(state.relationship.trust)}</strong></span>
                <span>Quen thuộc <strong>{Math.round(state.relationship.familiarity)}</strong></span>
              </div>
              <details className="bond-details"><summary>Hành trình gắn bó</summary>
                <ol>{bondStages.map((stage, index) => <li key={stage} className={index + 1 <= bond.level ? 'reached' : ''}>{index + 1 <= bond.level ? '✓ ' : ''}{stage}<small>{index * 25} XP</small></li>)}</ol>
                <h3>Phản ứng đã mở</h3>
                {bond.unlocked.length ? <ul>{bond.unlocked.map(item => <li key={item}>{item}</li>)}</ul> : <p>Chăm sóc và chơi cùng để Bôngg dần quen bạn.</p>}
                <p>Không giảm cấp khi bạn nghỉ chơi.</p>
              </details>
            </section>
            <section className="card stats">
              <div className="section-heading">
                <h2>Hôm nay {petName} thế nào?</h2>
                <span className="live-dot" />
              </div>
              {Object.entries(statLabels).map(([key, label]) => {
                const value = state.stats[key as keyof typeof state.stats];
                const need = [
                  "hunger",
                  "boredom",
                  "stress",
                  "sleepiness",
                ].includes(key);
                return (
                  <div
                    className={`stat ${need ? "need" : ""} ${need && value >= 65 ? "warning" : ""}`}
                    key={key}
                  >
                    <div>
                      <span>{label}</span>
                      <strong>
                        {Math.round(value)}
                        <small>/100</small>
                      </strong>
                    </div>
                    <progress value={value} max={100} aria-label={label} />
                  </div>
                );
              })}
              <p className="legend">
                Đói, buồn chán, căng thẳng và buồn ngủ: càng thấp càng tốt.
              </p>
            </section>
            <section className="card preferences">
              <div className="section-heading">
                <h2>Điều pet đang ghi nhớ</h2>
                <span>SỞ THÍCH</span>
              </div>
              <p>
                Món quen:{" "}
                {state.memory.preferences.favoriteFood === "chicken"
                  ? "Gà"
                  : "Hạt"}
              </p>
              <p>
                Đồ chơi quen:{" "}
                {state.memory.preferences.favoriteToy === "rope"
                  ? "Dây kéo"
                  : "Bóng xanh"}
              </p>
              <p>
                Được vuốt đầu:{" "}
                {state.memory.preferences.learned["action:head_scratch"] ?? 0}{" "}
                lần
              </p>
              <small>
                Sở thích được cập nhật sau nhiều lần ăn và chơi cùng bạn.
              </small>
            </section>
            <section className="card keepsakes">
              <h2>Nhịp quen bên nhau</h2>
              {(pet.habits ?? []).length ? <ul>{pet.habits.map(habit => <li key={habit.key}>{habit.description} — ghi nhận trong {habit.days} ngày khác nhau.</li>)}</ul> : <p className="empty">Bôngg cần ít nhất 3 ngày có hoạt động cùng buổi để nhận ra một nhịp quen.</p>}
              <p className="muted small">Dựa trên lịch sử còn lưu trong 28 ngày gần đây, theo giờ Việt Nam. Không mất điểm khi bạn vắng mặt.</p>
            </section>
            <section className="card keepsakes">
              <div className="section-heading"><h2>Kỷ niệm đáng nhớ</h2><span>GIỮ LẠI</span></div>
              {(state.memory.keepsakes ?? []).length ? <ol>{[...state.memory.keepsakes].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8).map(item => <li key={item.key}><span aria-hidden="true">♡</span><div><p>{item.title}</p><time dateTime={item.at}>{new Date(item.at).toLocaleDateString('vi-VN')}</time></div></li>)}</ol> : <p className="empty">Những bữa ăn, lần vuốt đầu và mốc gắn bó sẽ được lưu ở đây.</p>}
              <p className="memory-note">Tách riêng với nhật ký gần đây. Kỷ niệm quan trọng được ưu tiên giữ lại.</p>
            </section>
            <section className="card journal">
              <div className="section-heading">
                <h2>Những khoảnh khắc nhỏ</h2>
                <span>GẦN ĐÂY</span>
              </div>
              {state.memory.recent.length ? (
                <ol>
                  {state.memory.recent
                    .slice(-5)
                    .reverse()
                    .map((event, index) => (
                      <li key={`${event.at}-${index}`}>
                        <span className="journal-dot" />
                        <div>
                          <p>{actions[event.action] ?? event.action}</p>
                          <time>
                            {new Date(event.at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="empty">
                  Chưa có kỷ niệm nào. Hãy thử vuốt ve pet nhé.
                </p>
              )}
            </section>
          </aside>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => void refresh()}>Tải lại trạng thái</button>
          </div>
        )}
        <footer>
          <span>little companion · lớn lên từ những điều nhỏ bé</span>
          <span>
            Pet tự hoạt động khi trang đang mở. Đóng hoặc ẩn trang sẽ tạm nghỉ,
            không bị trừ gắn bó.
          </span>
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
