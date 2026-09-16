# Bộ nhớ và gắn bó của Bôngg

Bản đầu của giai đoạn 4. Thông số có thể điều chỉnh khi phát triển; không cần API.

| Cấp | Mốc | XP tối thiểu | Thay đổi |
| --- | --- | --- | --- |
| 1 | Mới gặp | 0 | Phản ứng cơ bản |
| 2 | Quen thuộc | 25 | Ưu tiên đón chủ hơn, mô tả thân quen |
| 3 | Bạn bè | 50 | Vuốt đầu giảm thêm 3 stress |
| 4 | Bạn thân | 75 | Ưu tiên ngồi bên chủ hơn |
| 5 | Gia đình | 100 | Ngồi bên chủ giảm thêm 5 stress |
| 6 | Bạn đồng hành | 125 | Ưu tiên rủ chơi đồ chơi quen thuộc |
| 7 | Tri kỷ | 150 | Phản ứng đón chủ đặc biệt |

Các lợi ích cộng dồn. Đói, mệt và điều kiện hành động vẫn được xét; quan hệ không ép pet bỏ qua nhu cầu. XP tiếp tục tăng sau cấp 7. Không phạt gắn bó khi người dùng vắng mặt.

## Ký ức

- Nhật ký gần đây: 20 sự kiện mới nhất.
- Episodic: 200 sự kiện; khi đầy, loại sự kiện có importance thấp nhất, cũ nhất trước.
- Kỷ niệm: tối đa 50 mục riêng, ghi một lần theo khóa: tương tác sớm nhất còn được ghi nhớ, đạt mốc quan hệ, món/đồ chơi trở nên quen thuộc. Khi đầy cũng ưu tiên giữ mục quan trọng. Đây là bộ nhớ có giới hạn, không phải lưu vô hạn.
- Giao diện hiển thị 8 kỷ niệm mới nhất và hành trình quan hệ trong mục có thể mở rộng.

## Dữ liệu cũ

Giữ định dạng version 1 với trường bổ sung. File cũ thiếu kỷ niệm được khôi phục từ các sự kiện còn lưu; không bịa ngày hoặc coi đó là lần đầu tiên trong toàn bộ đời pet. Các mốc đã vượt qua không được tạo lại với ngày giả.

XP, tên, chỉ số, sở thích và lịch sử vẫn giữ nguyên. Cấp cũ lớn hơn 7 được quy về Tri kỷ, giữ nguyên tổng XP. Đọc file không tự ghi lại; lần lưu thành công tiếp theo ghi định dạng bổ sung. Các file sao lưu vận hành nằm trong `.tools/`.

Chưa có dự đoán giờ chủ về hoặc phụ kiện mở khóa. Bổ sung nhận diện nhịp quen và mốc ngày được mô tả bên dưới.

## Nhịp quen và ngày đặc biệt

Bản tiếp theo nhận diện chơi cùng/vuốt đầu trong cùng buổi trên ít nhất 3 ngày khác nhau, từ episodic còn giữ trong 28 ngày gần đây. Dùng giờ Việt Nam: đêm 0–6, sáng 6–12, chiều 12–18, tối 18–24. Một ngày chỉ tính một lần mỗi hoạt động/buổi. Đây là nhận diện mẫu lịch sử, chưa dự đoán giờ chủ về; đã ảnh hưởng nhẹ đến lời mời tương tác như mô tả dưới đây; chơi có thể do pet chủ động khi chủ có mặt. Mẫu tự hết khi thiếu bằng chứng gần đây, không trừ quan hệ.

Kỷ niệm ngày 7, 30, 100 kể từ ngày gặp đầu được ghi khi pet thực hiện hành động với chủ có mặt trong ngày đó. Không bù các ngày đã bỏ lỡ, không thưởng thêm XP. Mốc ngày dùng lịch Việt Nam, không dùng phút mô phỏng. Tận dụng bộ nhớ hiện có, không đổi định dạng save.

Đã kiểm tra build giao diện và 25/25 tests, gồm phân biệt ngày, múi giờ, dữ liệu cũ/tương lai, chống lặp kỷ niệm và điều kiện chủ có mặt.



## Phản ứng theo nhịp quen

Khi đúng buổi quen thuộc, điểm mang đồ chơi hoặc xin chú ý tăng 12. Chỉ áp dụng khi chủ có mặt, không bật chế độ đêm/tiếng động, hunger < 60, energy >= 40, sleepiness < 65 và stress < 60. Điều kiện có đồ chơi, cooldown 20 phút mô phỏng và giảm điểm do lặp vẫn giữ nguyên. Đây là tăng khả năng lựa chọn, không bảo đảm pet luôn rủ chơi.

Lời mời không tự thực hiện vuốt đầu, không cộng XP và không được tính là bằng chứng mới của thói quen. Khi không đủ lịch sử trong 28 ngày, ưu tiên tự mất đi, không phạt quan hệ. Quyết định dùng cùng thời điểm với tick để mô phỏng và kiểm thử nhất quán.
