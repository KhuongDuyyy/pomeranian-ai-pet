# Bộ tư thế Bôngg V1

Ngày: 2026-09-17. Công cụ: built-in image_gen (không dùng CLI hoặc API key).

Ảnh chuẩn giữ nguyên tại `web/public/assets/pomeranian-reference.png`.
Asset chọn: `web/public/assets/bongg-poses-v1.png` (1536×1024, lưới 3×2). Sáu ô lần lượt: đứng, bước đi, ngủ, ăn, chơi bóng, vuốt đầu. Nền kem đục; không phải ảnh nền trong suốt. Không cắt hoặc xử lý lại ảnh bằng mã.

## Prompt tạo atlas

Use case: stylized-concept. Asset type: production 2D game character pose atlas, ONE single spritesheet, exactly 3 columns by 2 rows of equally sized square cells, landscape 1536x1024. Input image 1 is the canonical CHARACTER IDENTITY reference for Bôngg, a white Pomeranian puppy. Match its face, very fluffy warm-white coat, huge round dark-brown glossy eyes, black nose, pink inner triangular ears, small paws, plume tail curling over back, cute softly rendered cartoon style. No collar or clothing. Do not copy background.
Produce six full-body poses of the SAME puppy, one centered fully contained in each equal cell, 12% empty margin all around, consistent scale, camera and lighting, no overlap across cells:
top-left: idle standing, looking warmly toward viewer, mouth gently smiling.
top-middle: walking left in a clear mid-step pose, one front paw raised, side three-quarter view.
top-right: curled up sleeping, eyes CLOSED, head resting on paws, fluffy tail tucked around body.
bottom-left: eating from a simple small pale-blue food bowl, head lowered toward bowl, eyes focused down, all body visible.
bottom-middle: playful bow holding a small BLUE BALL gently in mouth, happy eyes.
bottom-right: sitting contentedly with eyes CLOSED, head tilted into an imaginary gentle head scratch, smiling softly, NO human hand.
Transparent background with real alpha, not a checkerboard illustration. If transparency unsupported use a perfectly uniform solid pale cream background #f6f4ee in every cell. No text, no labels, no numbers, no panel lines, no scenery, no decorative hearts or pawprints. This exact regular grid will be displayed with CSS sprite coordinates, so centering and safe margins are essential. Preserve identity very closely.

## Prompt chỉnh nền

Edit target: this exact 3 by 2 Pomeranian sprite atlas. Preserve all six puppies, their exact identity, poses, objects, sizes and grid positions. ONLY replace the entire gray/black gradient backdrop with a single perfectly uniform pale cream color #f6f4ee. No vignette, no gradients, no cast shadows around cells, no texture. Ensure all spaces between puppies and all edges are the same solid #f6f4ee color. Keep the six puppies unchanged. Do not add anything. Keep exact 1536x1024 canvas.

## Phạm vi

Giữ mặt, lông trắng bông, mắt nâu đen, tai hồng và đuôi xù dựa trên ảnh chuẩn. Đây là bộ pose được tạo lại, không phải bản sao từng pixel của ảnh gốc. Chuyển động V1 dùng các pose và CSS, chưa phải bộ frame đi bộ đầy đủ hoặc rig xương. Các hiệu ứng tuân theo giảm chuyển động của hệ điều hành. Ảnh gốc vẫn mở được từ nút Xem ảnh chuẩn.

