# Pomeranian AI Pet — Core V1

Thú cưng Pomeranian trắng chạy hoàn toàn local bằng TypeScript. Không cần API key, UI hoặc database. Tên mặc định: **Bong**.

## Chạy trong VS Code trên máy hiện tại

Mở thư mục `C:\Users\khuon\pomeranian-ai-pet`, mở **terminal mới**, rồi chạy:

```powershell
npm run dev
```

Repo đã được cài dependency và có Node/npm riêng trong `.tools/` (không đưa lên Git). Cấu hình VS Code tự thêm bộ công cụ này cho terminal mới. Nếu terminal cũ chưa nhận npm:

```powershell
. .\scripts\activate.ps1
npm run dev
```

Mặc định chương trình mô phỏng 12 bước, mỗi bước 10 phút, in trạng thái, lưu vào `data/pet-state.json` và kết thúc. Lần chạy tiếp theo tiếp tục từ dữ liệu đã lưu.

```powershell
npm.cmd run dev -- --steps 30
npm run interactive
```

Trong chế độ tương tác:

| Lệnh | Tác dụng |
| --- | --- |
| `status` | Xem trạng thái, mood và quan hệ |
| `tick 30` | Trôi qua 30 phút, pet chọn một hành động |
| `food` | Đặt một phần ăn, pet tự quyết định ngay |
| `play` | Chơi nếu có chủ, đồ chơi và đủ năng lượng |
| `sleep` | Cho pet ngủ, hồi phục tức thời trong V1 |
| `pet` | Cho pet ngồi cạnh chủ để tăng gắn bó |
| `leave` / `arrive` | Chủ rời đi / quay lại |
| `noise` | Phát tiếng động lớn, tăng stress và pet phản ứng |
| `toy` / `night` | Bật/tắt đồ chơi hoặc ban đêm |
| `scores` | Xem điểm các hành động khả dụng, không thực hiện |
| `save` / `quit` | Lưu / lưu và thoát |

Tự lưu sau mỗi lệnh. `Ctrl+C` hoặc đóng luồng nhập cũng lưu trạng thái; cưỡng bức tắt tiến trình chỉ giữ lần lưu gần nhất.

## Máy khác / clone mới

Cài Node.js **22.14+** kèm npm (khuyến nghị Node 24), sau đó:

```sh
npm ci
npm run dev
```

`.tools/` chỉ là bộ công cụ local trên máy hiện tại, không phải dependency cần commit. `package-lock.json` khóa phiên bản dependency để tái lập môi trường.

## Cấu trúc

```text
src/
  index.ts                 # Terminal simulation và lệnh tương tác
  pet/
    personality.ts         # Tính cách cố định và giống loài
    stats.ts               # Chỉ số 0–100 và thời gian mô phỏng
    relationship.ts        # Tình cảm, tin cậy, quen thuộc, XP/level
    mood.ts                # Mood suy ra từ stats
    memory.ts              # Profile, preferences, episodic, recent
    context.ts             # Chủ, đồ ăn, đồ chơi, tiếng động, ban đêm
    actions.ts             # 14 hành động, điều kiện và hiệu ứng
    decisionEngine.ts      # Điểm, ưu tiên nhu cầu, tránh lặp, ngẫu nhiên
    state.ts               # Kiểu dữ liệu và trạng thái khởi tạo
    pet.ts                 # Điều phối thời gian, quyết định và bộ nhớ
    persistence.ts         # Kiểm tra schema, đọc/ghi JSON
tests/pet.test.ts
data/pet-state.json         # Tự sinh, không commit dữ liệu cá nhân
```

## Quy tắc V1

- Mỗi 10 phút: hunger +1, energy −0.3, boredom +0.5, sleepiness +0.2. Chỉ số được giới hạn trong 0–100.
- Mood ưu tiên: hungry → sleepy → nervous → excited → playful → happy → neutral theo ngưỡng trong `mood.ts`.
- Decision Engine xét personality, stats, relationship, context, ba hành động gần nhất và nhiễu ngẫu nhiên nhỏ. Có thể truyền hàm random cố định để kiểm tra tái lập.
- Thiếu điều kiện thì hành động bị loại: không ăn khi thiếu thức ăn, không chơi khi chủ vắng mặt hoặc thiếu đồ chơi. Ăn tiêu thụ phần ăn. Tiếng động và sự kiện chủ về hết hiệu lực sau một bước.
- Memory có profile và preferences lâu dài; recent giữ 20 sự kiện, episodic giữ 200 sự kiện. V1 chưa tự học sở thích.
- Bond level = `1 + floor(bondXp / 25)`. Chơi, ăn khi có chủ và ở cạnh chủ tăng quan hệ.
- File lưu có version và được kiểm tra kiểu, miền giá trị, ngày giờ, kích thước bộ nhớ. File hỏng gây lỗi rõ ràng và được giữ nguyên. Ghi qua file tạm rồi đổi tên để tránh JSON bị ghi dở.
- Chạy một phiên trên mỗi file state. Context là môi trường của phiên, được khởi tạo lại khi mở chương trình. Không tự cộng thời gian offline; một bước chỉ thực hiện một hành động, kể cả `tick 30`. Health được giữ để mở rộng, chưa có cơ chế bệnh tật. Sleep/eat/play là hiệu ứng tức thời.
- Có thể chạy phiên riêng bằng `npm.cmd run dev -- --state data/another-pet.json` trên Windows (dùng `npm` trên macOS/Linux). Dùng `npm.cmd` khi truyền tham số để PowerShell giữ nguyên dấu `--`.

## Kiểm tra và build

```sh
npm run typecheck
npm test
npm run build
npm start
```

Tests kiểm tra thời gian, ngưỡng mood, ưu tiên nhu cầu, điều kiện hành động, quan hệ, bộ nhớ, tính độc lập giữa pet, giới hạn chỉ số và lưu/khôi phục dữ liệu. Test runner chạy trong cùng tiến trình để tương thích môi trường hạn chế tạo tiến trình phụ.

`npm run dev` biên dịch TypeScript trước mỗi lần chạy; không tự watch. Core không phụ thuộc terminal, có thể tích hợp UI hoặc dịch vụ AI qua lớp `Pet` ở phiên bản sau.
