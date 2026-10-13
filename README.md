# EduHub

Cộng đồng giáo viên Việt Nam để khám phá học liệu, chia sẻ dự án giáo dục và trao đổi chuyên môn theo bộ môn.

## Chức năng

- Bảng tin và kho dự án có lọc theo môn học, tìm kiếm, lưu và đánh dấu hữu ích.
- Trang chi tiết dự án với ảnh bìa, tài liệu tải về, liên kết dùng thử, video và hướng dẫn sử dụng.
- Góp ý tính năng có bình chọn và trạng thái xử lý; tác giả đăng nhật ký phiên bản/changelog theo dự án.
- Bộ sưu tập học liệu công khai theo bộ môn/chủ đề; quản trị viên nhận báo cáo bản quyền, riêng tư, spam và liên kết không an toàn.
- Bảng xếp hạng tổng điểm, tháng và 7 ngày dựa trên lịch sử phát sinh điểm.
- Đường dẫn riêng có thể chia sẻ cho dự án (`/projects/:id`) và tường giáo viên (`/teachers/:id`).
- Tài khoản giáo viên qua Supabase Auth.
- Hồ sơ chuyên môn có tỉnh/thành, phường/xã, trường, cấp dạy, môn học, kinh nghiệm, thế mạnh, ảnh đại diện và ảnh bìa.
- Trang giáo viên có điểm đóng góp, tổng hợp đánh giá có trọng số, dự án đã duyệt và hoạt động cộng đồng gần đây.
- Gửi dự án vào hàng chờ để quản trị viên duyệt trước khi công khai.
- Dự án có ảnh bìa, tài liệu đính kèm, liên kết dùng thử/tải về, video demo và hướng dẫn sử dụng.
- Bình luận và đánh giá sao trên dự án, diễn đàn theo môn học và trả lời chủ đề.
- Bộ sưu tập dự án đã lưu đồng bộ theo tài khoản, theo dõi giáo viên và dòng dự án mới từ những giáo viên đang theo dõi.
- Bảng đóng góp giáo viên; điểm được tính phía máy chủ từ dự án duyệt, lượt hữu ích và đánh giá tốt.
- Ảnh hồ sơ và ảnh bìa ưu tiên ImgBB nếu có cấu hình API key; tài liệu tải lên tiếp tục dùng Supabase Storage.
- Đăng nhập Google qua Supabase OAuth; cần khai báo Google provider và URL chuyển hướng trong Supabase Dashboard.
- Diễn đàn có trang chi tiết theo URL, trả lời theo nhánh, thích bình luận và hiện trạng thái đang nhập qua Supabase Realtime.
- Bảng quản trị có biểu đồ truy cập, tài khoản/role/xác minh, quản lý toàn bộ dự án và hàng chờ, báo cáo cộng đồng.
- Trang `/admin` chỉ hiển thị với hồ sơ có role `admin`; số liệu truy cập được ghi từ lúc triển khai SQL mới.
- Logo EduHub được dùng ở thanh điều hướng và favicon; giao diện có chuyển động nhẹ, skeleton tải và hỗ trợ giảm chuyển động.

Địa giới dùng API v2 của [provinces.open-api.vn](https://provinces.open-api.vn/api/v2/redoc), có cache 7 ngày trên trình duyệt và cho phép nhập thủ công nếu dịch vụ không truy cập được. Tên trường được gợi ý từ hồ sơ cộng đồng cùng tỉnh/thành; hiện chưa tích hợp danh bạ trường công khai của Bộ GDĐT.

## Chạy tại máy

1. Tạo một dự án Supabase.
2. Chạy duy nhất `supabase_setup.sql` trong SQL Editor. File gồm schema, RLS, các tính năng cộng đồng, diễn đàn realtime, analytics quản trị và bootstrap admin.
3. Trong Supabase Auth, tạo user `admin@gmail.com` và xác nhận email. Khi email đã xác nhận, trigger trong SQL tự gán role `admin`; mật khẩu chỉ được lưu trong Supabase Auth, không nằm trong SQL hoặc bundle frontend.
4. Sao chép `.env.example` thành `.env.local`, rồi điền `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` và `VITE_IMGBB_API_KEY`.
5. Bật xác nhận email và kiểm tra URL chuyển hướng về địa chỉ EduHub đang chạy.
6. ImgBB cần key trong request từ trình duyệt, nên biến `VITE_*` sẽ có thể đọc được trong ứng dụng build; dùng key riêng cho EduHub và theo dõi giới hạn. API nhận ảnh multipart, tài liệu ImgBB ghi giới hạn 32 MB.
7. (Tùy chọn) Nếu chưa có ImgBB key, Cloudinary unsigned upload hoặc Supabase Storage vẫn là phương án dự phòng. Không đưa Cloudinary API secret vào ứng dụng.
8. Để bật Google: trong Supabase Auth → Providers, cấu hình Google OAuth Client ID/Secret và thêm URL callback Supabase vào Google Cloud Console; thêm URL ứng dụng vào danh sách Redirect URLs của Supabase.
9. Chạy:

   ```sh
   npm install
   npm run dev
   ```

Giao diện không còn nạp dự án, diễn đàn, hồ sơ hoặc điểm mẫu. Cần cấu hình Supabase để đọc/ghi nội dung và đo lượt truy cập.

## Cấp quyền quản trị

Tài khoản `admin@gmail.com` đã xác nhận email sẽ tự được cấp role `admin`. Với tài khoản quản trị khác, chạy SQL sau và thay UUID bằng ID trong Supabase Auth:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

Quyền duyệt và quản lý dữ liệu được kiểm tra bằng Row Level Security trong `supabase_setup.sql`. Không đặt khóa `service_role` vào biến `VITE_*` hoặc gửi nó tới trình duyệt.

## Triển khai

EduHub dùng Vite và có thể triển khai thành trang tĩnh trên Vercel. Cấu hình `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong môi trường build của dự án. Các lệnh `npm run dev` và `npm start` chỉ chạy giao diện Vite; API Express thử nghiệm cũ trong `server.ts` không còn nằm trên luồng chạy của ứng dụng mới.

Các họa tiết `public/edu-vietnam-pattern.svg` được vẽ riêng cho EduHub. `public/vietnam-flag.svg` theo hình học quốc kỳ; Wikimedia Commons cũng có bản SVG được đánh dấu phạm vi công cộng tại Việt Nam: https://commons.wikimedia.org/wiki/File:Flag_of_Vietnam.svg. Họa tiết trống đồng `public/trongdong.svg` có sẵn trong dự án.
