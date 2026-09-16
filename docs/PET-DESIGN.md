# Định hướng và đối chiếu thiết kế pet

Nguồn: cuộc trò chuyện “Chung thú cưng AI” (6aaa96a3-ee44-83ec-ace2-c97d23fda9e5), được đọc lại ngày 2026-09-16; ảnh người dùng cung cấp cùng ngày.

## Những gì người dùng đã xác nhận

- Tên pet: **Bôngg** (người dùng xác nhận ngày 2026-09-16). Các tên “Miu”, “Bong” và “chưa đặt” trong nguồn cũ chỉ là ví dụ hoặc mặc định trước đây.
- [Toàn văn đề xuất ban đầu](references/pomeranian-initial-proposal.txt) do người dùng bổ sung ngày 2026-09-16 được lưu nguyên văn. Đây là **nguồn định hướng có thể điều chỉnh trong quá trình phát triển**, không phải đặc tả bất biến hoặc danh sách tính năng đã hoàn thành. Các thông số, ngưỡng, công thức, cấp độ và ví dụ có thể thay đổi khi cần; cập nhật quyết định mới tại tài liệu này cùng lý do.
- Loài: Pomeranian trắng (Phốc sóc). Hoạt hình hơn ảnh chó thật.
- Ảnh chuẩn: `web/public/assets/pomeranian-reference.png`, sao chép nguyên bản từ `205ccedb-e84b-414d-b77a-66f30e950c80.png`.
- SHA256: `2788ACA5D6B7FEBF8C95B6ABCE41636C755145E76BA2B82AB6612E4C89250DA4`.
- Giữ lông trắng bông dày, thân nhỏ, mắt tròn nâu đen có điểm sáng, mũi đen, tai tam giác hồng dựng, đuôi bông cuộn trên lưng. Không thay bằng chó SVG khác, không tự thêm vòng cổ hoặc thay màu lông.
- Xây core TypeScript trước, sau đó giao diện; React + TypeScript đã được chọn cho giao diện. Chưa cần OpenAI API.

## Định hướng được đề xuất trong cuộc trò chuyện trước

Pet quấn chủ, tò mò, ham chơi, cảnh giác, hơi bướng, thích vuốt đầu, hơi tham ăn, không thích tiếng động lớn. Giao tiếp ưu tiên hành động, âm thanh ngắn và lời mô tả của người quan sát; không dùng câu thoại như một trợ lý hoặc tạo cảm giác tội lỗi khi người dùng vắng mặt.

11 giá trị personality, 7 stats, 5 trường relationship và 7 mood V1 trong core khớp bản thiết kế cụ thể. Các hệ số chấm điểm trong cuộc trò chuyện là ví dụ, không phải thông số bắt buộc: bản chạy có giới hạn điều kiện và cooldown để tránh lặp vô lý.

## Đã nối trong bản hiện tại

- Dùng nguyên ảnh chuẩn; mô tả hành động và tâm trạng tách khỏi ảnh, không giả vờ ảnh tĩnh có thể hiện đủ mọi tư thế.
- Chu kỳ tự chủ duy nhất ở server: 20 giây thật → 1 phút mô phỏng + thời lượng hành động. Chỉ chạy khi có trang hiển thị gửi tín hiệu hiện diện; nhiều tab không nhân đôi chu kỳ. Có nút tạm dừng. Hết tín hiệu sau 8 giây thì dừng, không bù thời gian offline hay trừ gắn bó.
- Cho ăn đặt thức ăn trong bát, pet tự quyết định ăn ở chu kỳ tiếp theo. Vuốt đầu là `headScratch`, không còn giả lập bằng ngồi cạnh chủ: happiness +8, stress −5, affection +2, XP +1.
- Học số lần ăn/chơi/vuốt đầu. Sau ít nhất 3 trải nghiệm, món/đồ chơi có nhiều trải nghiệm nhất trở thành sở thích; được lưu và góp phần vào điểm chọn hành động. Đây là học theo quy tắc, chưa phải mô hình AI.
- Recent 20, episodic 200; sự kiện mới có importance. Save cũ được bổ sung các trường mới khi tải mà không xóa trạng thái.

## Còn thiếu so với tầm nhìn dài hạn — không tuyên bố đã hoàn tất

- Bộ pose/sprite/rig nhất quán từ ảnh chuẩn: nghiêng đầu, tai dựng, vẫy đuôi, chạy vòng, tha bóng, ngủ cuộn tròn. Hiện ảnh vẫn tĩnh, chỉ có hiệu ứng phản hồi nhẹ và mô tả hành vi.
- Âm thanh thật, phân đoạn thời lượng hành động và ngắt hành động đang diễn ra.
- Context đầy đủ theo thời gian/ngữ cảnh: timeOfDay, nearbyObjects và nhiều phòng; hiện dùng isNight, cờ đồ vật và living_room. Context chưa được lưu qua lần khởi động server.
- Trí nhớ thói quen giờ chủ đến, sự kiện đặc biệt, nơi yêu thích, bộ nhớ quan trọng giữ lâu hơn giới hạn 200; hiện importance chưa quyết định giữ/xóa sự kiện.
- Bảy giai đoạn quan hệ có tên và mở khóa hành vi/phụ kiện; hiện XP/level vẫn theo công thức V1, chưa giới hạn bảy giai đoạn.
- Tiến hóa theo quan hệ, hội thoại GPT và tích hợp nền tảng khác.

Tên đã chốt hiện tại là **Bôngg**. Bát hạt và các hệ số thời gian vẫn là mặc định kỹ thuật, không phải sở thích hoặc thông số bất biến. Không coi mọi ví dụ do trợ lý đề xuất trong chat cũ là một quyết định người dùng đã phê duyệt.
