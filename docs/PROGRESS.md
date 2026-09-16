# Tiến độ Bôngg — 2026-09-17

Đối chiếu [lộ trình ban đầu](references/initial-roadmap.md). Đây là tình trạng triển khai, không thay đổi bản nguồn ban đầu.

| Giai đoạn | Trạng thái | Phạm vi |
| --- | --- | --- |
| 1. Hành vi V1 | Có bản chạy ổn định | Personality, stats, mood, quan hệ, chọn hành động, thời gian mô phỏng, cooldown, tự hoạt động khi trang hiển thị |
| 2. Giao diện thử nghiệm | Đã có | React + TypeScript, chăm sóc, chỉ số, nhật ký, môi trường, tự lưu và đổi tên |
| 3. Hình ảnh và animation | Đã có bản 2D cơ bản | 6 pose từ ảnh chuẩn: đứng, bước đi, ngủ, ăn, chơi bóng, đón vuốt đầu; chuyển động nhẹ theo từng hành động; xem ảnh gốc và tắt chuyển động |
| 4. Bộ nhớ và gắn bó sâu hơn | Đã có bản đầu | Kỷ niệm riêng, ưu tiên giữ sự kiện quan trọng, 7 mốc quan hệ, mở phản ứng và tác động theo độ thân thiết; chưa học thói quen theo giờ |
| 5. AI ngôn ngữ | Chưa triển khai, vẫn tùy chọn | Không cần API key để chạy bản hiện tại |

## Kết quả bước hình ảnh

- Asset mới: `web/public/assets/bongg-poses-v1.png` (lưới 3×2, 1536×1024), tạo bằng built-in image_gen từ ảnh chuẩn. Giữ nguyên file ảnh chuẩn trước đó. Prompt và giới hạn được lưu tại [POSE-ASSETS.md](POSE-ASSETS.md).
- Mỗi hành động có ánh xạ pose, chuyển động và thời lượng hiển thị. Ví dụ sleep/rest → nằm ngủ; eat → ăn; headScratch → nhắm mắt, nghiêng đầu; explore/wander → bước đi.
- Phản ứng hiển thị 6–16 giây theo thời gian thật, sau đó về tư thế theo mood. Không phát lại sự kiện cũ khi tải trang. Thao tác mới thay thế phản ứng trước. Thời gian hiển thị tách khỏi phút mô phỏng và không cộng thưởng lần nữa.
- Có nút tắt chuyển động; tôn trọng `prefers-reduced-motion`. Tải ảnh lỗi thì dùng ảnh chuẩn. Chơi dây kéo không hiển thị ảnh ngậm bóng xanh.
- Kiểm tra: build UI/typecheck thành công; 19/19 tests. Kiểm tra trực tiếp giao diện đứng, vuốt đầu và nghỉ.

## Giới hạn cần giữ rõ

Đây là animation theo pose + CSS, chưa có nhiều frame bước chân, chuyển động đuôi độc lập, rig xương hoặc 3D. Pose chơi hiện chỉ có bóng xanh; các đồ chơi khác dùng tư thế đứng với phản ứng nhẹ. Chưa có âm thanh. Core vẫn áp hiệu ứng hành động ngay rồi cộng thời gian mô phỏng; chưa có tiến trình hành động vật lý để hủy giữa chừng.

## Ưu tiên tiếp theo

Tiếp tục giai đoạn 4: học thói quen tương tác và bổ sung sự kiện đặc biệt. Bản bộ nhớ hiện tại đã qua build UI/typecheck và 23/23 tests, bao gồm chuyển dữ liệu cũ, giữ kỷ niệm, mốc quan hệ và ưu tiên nhu cầu cấp thiết. Xem [bộ nhớ và gắn bó](MEMORY-AND-BOND.md). Các ngưỡng vẫn là khung ban đầu có thể điều chỉnh.

### Bổ sung nhịp quen

Đã thêm nhận diện mẫu chơi/vuốt đầu qua nhiều ngày và kỷ niệm ngày 7/30/100. Chi tiết và giới hạn ở MEMORY-AND-BOND.md. Giai đoạn 4 có bản nhận diện lịch sử; còn dự đoán thói quen, phản ứng theo thói quen và sự kiện tùy chỉnh. Build thành công, 25/25 tests đạt.

### Phản ứng theo nhịp quen đã nối

Đã nối mẫu lịch sử vào điểm rủ chơi/xin chú ý, có điều kiện nhu cầu, môi trường và cooldown. Build giao diện thành công, 26/26 tests đạt. Bước kế tiếp: hành động có tiến trình và chuyển tiếp tự nhiên. Dữ liệu lưu không đổi cấu trúc.

### Tiến trình hoạt cảnh và chống tương tác trùng

Ăn/chơi/ngủ/nghỉ có thanh tiến trình theo thời lượng hoạt cảnh 10–16 giây. Server từ chối act/tick mới trong thời gian đó, chu kỳ tự chủ chờ kết thúc. Đổi tên/đặt thức ăn vẫn được phép; tiếng động có thể thay hoạt cảnh. Đón chủ không chen vào hoạt động đang diễn ra. Tiến trình tính từ sự kiện đã lưu nên tải lại trang không nhận thưởng thêm.

Giới hạn: đây là khóa tương tác theo hoạt cảnh, chưa phải mô phỏng hiệu ứng từng giây. Chỉ số, XP và phút mô phỏng vẫn áp dụng một lần ở đầu hành động; tiếng động không hoàn lại hiệu ứng. Terminal vẫn chạy đồng bộ. 28/28 tests đạt, gồm chống gửi trùng và lỗi lưu đĩa.
