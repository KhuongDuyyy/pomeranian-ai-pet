# Pomeranian AI Pet — Core V1

Thú cưng Pomeranian trắng chạy hoàn toàn local bằng TypeScript, có giao diện React và terminal simulation. Không cần API key hoặc database. Tên pet: **Bôngg**.

## Giao diện chăm sóc pet — React + TypeScript

Trong thư mục dự án, chạy lệnh sau ở PowerShell (không cần bật quyền chạy `.ps1`):

```powershell
.\start-pet.cmd
```

Khi terminal hiện `Pet UI: http://127.0.0.1:3000`, mở địa chỉ đó trong trình duyệt. Giữ terminal mở khi chơi; `Ctrl+C` để dừng. Cũng có thể nhấp đúp `start-pet.cmd` trong File Explorer.

Trên máy đã cài Node/npm: `npm.cmd run ui` (Windows) hoặc `npm run ui` (macOS/Linux). Máy mới chạy `npm ci` trước.

- Căn phòng 2D với Pomeranian trắng, tâm trạng, 7 chỉ số, cấp gắn bó và 5 hành động gần nhất.
- Nút cho ăn, chơi, vuốt đầu (phản ứng riêng), nghỉ, ngủ. Nút chưa khả dụng có mô tả lý do.
- Đổi tên pet, chuyển ngày/đêm, ra ngoài/về nhà, cất/lấy đồ chơi và thử tiếng động.
- `+10 phút` gọi Decision Engine để pet tự chọn một hành động; thời lượng hành động được cộng thêm.
- UI dùng API Node.js gọi trực tiếp lớp `Pet`; không có bản sao logic ở React. Thay đổi được xếp hàng và chỉ trả thành công sau khi ghi `data/pet-state.json`. Tải lại trình duyệt vẫn giữ tiến trình.
- Chỉ chạy **một server hoặc terminal simulation** với cùng file state. Context còn trong bộ nhớ của server; khởi động lại server sẽ đặt lại môi trường mặc định. Dữ liệu pet, lịch sử, tên và khoảng chờ vẫn được lưu.
- Server chỉ lắng nghe trên máy hiện tại (`127.0.0.1`). Chưa có đăng nhập, đồng bộ nhiều máy, hội thoại AI hay animation đầy đủ. Hình pet dùng nguyên ảnh chuẩn do người dùng gửi; chuyển động theo pose chưa có.

Giao diện nằm trong `web/src/`, API trong `src/server.ts` và `src/webApi.ts`. Chạy `npm run build:ui` để build giao diện; `npm run typecheck` kiểm tra cả core và React; `npm test` kiểm tra core, lưu dữ liệu và API. Có thể đặt biến môi trường `PORT` và `PET_STATE_PATH` khi cần phiên thử nghiệm riêng.

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

Mặc định chương trình mô phỏng 12 bước, mỗi bước chờ 10 phút mô phỏng rồi thực hiện một hành động có thời lượng riêng, in trạng thái, lưu vào `data/pet-state.json` và kết thúc. Lần chạy tiếp theo tiếp tục từ dữ liệu đã lưu.

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
| `sleep` | Ngủ 60 phút mô phỏng nếu đủ mệt hoặc buồn ngủ |
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
- Memory có profile và preferences lâu dài; recent giữ 20 sự kiện, episodic giữ 200 sự kiện. Sở thích được học theo số lần tương tác; chi tiết trong docs/PET-DESIGN.md.
- Bond level = `1 + floor(bondXp / 25)`. Chơi, ăn khi có chủ và ở cạnh chủ tăng quan hệ.
- File lưu có version và được kiểm tra kiểu, miền giá trị, ngày giờ, kích thước bộ nhớ. File hỏng gây lỗi rõ ràng và được giữ nguyên. Ghi qua file tạm rồi đổi tên để tránh JSON bị ghi dở.
- Chạy một phiên trên mỗi file state. Context là môi trường của phiên, được khởi tạo lại khi mở chương trình. Không tự cộng thời gian offline; một bước chỉ thực hiện một hành động, kể cả `tick 30`. Health được giữ để mở rộng, chưa có cơ chế bệnh tật.
- Thời lượng hành động được cộng vào `simulationMinutes` và nhu cầu cơ thể: ngủ 60 phút, nghỉ 15 phút, chơi 10 phút, ăn 5 phút. `tick 30` cộng 30 phút chờ **và** thời lượng hành động được chọn. Chương trình hoàn tất hành động ngay theo thời gian mô phỏng, không chờ ngoài đời; chưa có animation hoặc hành động đang diễn ra để ngắt giữa chừng.
- Chỉ xin ăn khi hunger ≥60, mỗi lần cách nhau ít nhất 45 phút mô phỏng sau lần xin trước. Mang đồ chơi, xin chú ý và tìm chủ có khoảng chờ 20 phút. Có thức ăn thì vẫn có thể ăn trong thời gian chờ xin ăn.
- Chỉ ngủ khi energy ≤30 hoặc sleepiness ≥65; ban đêm cho phép ngủ từ sleepiness ≥40. Nghỉ khi energy <75 hoặc stress >30.
- Đồng hồ và khoảng chờ được lưu cùng pet. File V1 cũ thiếu hai trường này tự khởi tạo chúng mà vẫn giữ stats, quan hệ và bộ nhớ.
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

## Đối chiếu thiết kế gốc

Xem [PET-DESIGN.md](docs/PET-DESIGN.md) cho ảnh chuẩn, các điểm đã khớp và những phần chưa hoàn tất. UI tự chạy một chu kỳ mỗi 20 giây khi trang hiển thị, có nút tạm dừng; không bù thời gian offline. Cho ăn trong UI đặt đồ vào bát để pet quyết định ở chu kỳ sau. Terminal vẫn hỗ trợ bước thủ công.
