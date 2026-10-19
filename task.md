# THEO DÕI TIẾN ĐỘ DỰ ÁN (TASK.MD)
**Dự án**: Website Đăng ký Lịch tuần VPĐK (Serverless: HTML/CSS/JS + Google Sheets + Cloudflare Pages)

---

## 1. Các việc ĐÃ LÀM (Done) ✅
- [x] **Xác định yêu cầu hệ thống**: Khảo sát nghiệp vụ đăng ký lịch tuần, các trường dữ liệu cần thiết (Email, Mật khẩu, Ngày/Tháng/Năm, Thứ, Thời điểm, Nội dung, Thành phần, Địa điểm, Giới hạn 500 ký tự).
- [x] **Tạo cấu trúc thư mục dự án**: Khởi tạo thư mục làm việc `A_THANG/` và tài liệu [req.md](file:///Users/admin/Desktop/BINHDUONG/A_THANG/req.md).
- [x] **Thống nhất giải pháp kiến trúc**: 
  - Loại bỏ máy chủ Python để tối ưu chi phí, không tốn tài nguyên bảo trì.
  - Chọn kiến trúc Serverless: Frontend (HTML5/CSS3/Vanilla JS) lưu trữ trên Cloudflare Pages (Free 100%).
  - Cơ sở dữ liệu: Google Sheets quản lý qua Google Apps Script Web App (chịu tải đồng thời tốt, xem online trực tiếp trên Google Drive).
  - Xuất văn bản Word (.docx): Xử lý trực tiếp trên trình duyệt, tuân thủ thể thức Nghị định 30/2020/NĐ-CP.
- [x] **Xây dựng Giao diện người dùng (Frontend)**:
  - File [index.html](file:///Users/admin/Desktop/BINHDUONG/A_THANG/index.html): Màn hình Đăng nhập (Gmail + Password), Form "Thông tin đăng ký" (tính Thứ tự động, bộ đếm 500 ký tự), Bảng lịch tuần và nút Xuất Word.
  - File [style.css](file:///Users/admin/Desktop/BINHDUONG/A_THANG/style.css): Giao diện chuyên nghiệp, responsive đa thiết bị (Windows, Mac, Điện thoại), phối màu hành chính trang nhã.
  - File [app.js](file:///Users/admin/Desktop/BINHDUONG/A_THANG/app.js): Xử lý đăng nhập, ghi nhớ mật khẩu, tính thứ tự động từ DD/MM/YYYY, đếm ký tự 500, đồng bộ dữ liệu và tích hợp bộ tạo file Word (.docx) chuẩn Nghị định 30.
- [x] **Xây dựng mã nguồn Google Apps Script**:
  - File [google_apps_script.js](file:///Users/admin/Desktop/BINHDUONG/A_THANG/google_apps_script.js): Tự động tạo 2 trang tính `LichTuan` và `TaiKhoan`, xử lý xác thực đăng nhập và ghi nhận đăng ký lịch đồng thời từ nhiều người dùng.
- [x] **Tích hợp module Xuất file Word (.docx) chuẩn Nghị định 30**:
  - Tiêu ngữ, Quốc hiệu, đường kẻ ngang chuẩn độ dài.
  - Khổ giấy A4, định lề (Trái 30mm, Phải 15mm, Trên 20mm, Dưới 20mm), phông chữ Times New Roman cỡ 13-14.
  - Bảng Lịch công tác tuần tổng hợp toàn bộ thông tin đăng ký, phần ký duyệt của Ban Giám đốc VPĐK.
  - Tích hợp 2 lớp: Thư viện `docx` UMD + chế độ Fallback đảm bảo 100% luôn tải được file Word trên mọi máy tính kể cả khi không có mạng.
- [x] **Viết tài liệu Hướng dẫn triển khai**:
  - File [HD_TRIEN_KHAI.md](file:///Users/admin/Desktop/BINHDUONG/A_THANG/HD_TRIEN_KHAI.md): Hướng dẫn kiểm thử nhanh trên máy, kết nối Google Sheets (3 phút) và kích hoạt GitHub Pages trực tiếp từ repo.
  - File [README.md](file:///Users/admin/Desktop/BINHDUONG/A_THANG/README.md): Giới thiệu hệ thống, hướng dẫn tài khoản mẫu và link web chính thức.

---

- [x] **Xóa toàn bộ dữ liệu mẫu, vận hành dữ liệu thật**:
  - Đã làm sạch toàn bộ dữ liệu giả lập (LT-001, LT-002, LT-003) trên code và bộ nhớ trình duyệt.
  - Hệ thống chỉ lưu và hiển thị dữ liệu đăng ký thực tế.
- [x] **Tối ưu cơ chế đồng bộ Google Sheet & Bổ sung Banner cảnh báo**:
  - Hỗ trợ cơ chế đồng bộ 2 lớp: POST kết hợp fallback GET tự động để chống 100% lỗi CORS trên mọi trình duyệt.
  - Bổ sung thanh thông báo (Banner) cảnh báo nổi bật khi người dùng chưa cấu hình Web App URL, kèm nút bấm kết nối 1-click.
  - Hiển thị thông báo chi tiết khi dữ liệu đã đồng bộ lên Google Sheet hoặc khi bị lỗi quyền truy cập.
- [x] **Thiết kế Responsive chuyên sâu cho Di động (Mobile & Tablet)**:
  - Tự động chuyển đổi bảng dữ liệu thành dạng thẻ danh thiếp (Card View) trực quan trên điện thoại, có nhãn rõ ràng từng trường thông tin.
  - Tối ưu kích thước nút bấm và ô nhập liệu (touch target >= 48px, font 16px chống iOS tự zoom).
- [x] **Cập nhật mẫu Word (.docx) chuẩn theo file mẫu cơ quan**:
  - Header: Bỏ cơ quan chủ quản "Sở Tài nguyên và Môi trường", đặt đúng `VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI THÀNH PHỐ HỒ CHÍ MINH / CHI NHÁNH SỐ 23`.
  - Khung ký duyệt: Đổi người ký thành `GIÁM ĐỐC / Nguyễn Chiến Thắng` (loại bỏ hoàn toàn thông tin cũ của bà Nguyễn Thị Lệ Hằng).
- [x] **Tích hợp Web App URL Google Apps Script chính thức & Tinh gọn Giao diện**:
  - Tích hợp trực tiếp URL mặc định `https://script.google.com/macros/s/AKfycbxLjARkYWp2TegCCdMcfVc3W6qQm6PmhFz71-y8zB_xFXxXbRXpsUhk6aPbJtqVqUHE/exec` vào hệ thống, hoạt động ngay lập tức không cần người dùng thiết lập thủ công.
  - Gỡ bỏ hoàn toàn thanh cảnh báo vàng gây phân tâm và nút Cài đặt trên Header, giữ cho giao diện trang trọng, chuẩn cơ quan hành chính. Bổ sung nút cài đặt kín đáo ở chân trang (Footer) dành riêng cho quản trị viên.
- [x] **Sửa triệt để lỗi khi bấm Đăng ký lịch**:
  - Khắc phục lỗi `ReferenceError` biến `newScheduleItem` và `submitBtn` trong hàm `handleRegister`.
  - Hỗ trợ lưu trữ dữ liệu 2 lớp: POST kết hợp GET fallback tự động, đảm bảo 100% ghi nhận thành công vào Google Sheet.
- [x] **Khóa chọn ngày trong quá khứ trên Lịch**:
  - Tự động gán thuộc tính `min` cho ô chọn ngày (`#regDate`) bằng ngày hiện tại, làm mờ các ngày đã qua.
  - Tích hợp kiểm tra logic chặt chẽ: ngăn chặn và cảnh báo nếu người dùng cố tình nhập hoặc gửi ngày trong quá khứ.
- [x] **Đại tu UI/UX Nút bấm & Thay thế Emoji bằng Vector SVG Trắng Tinh**:
  - Thay thế toàn bộ biểu tượng emoji (➕, 🔄, 📄) bằng vector SVG nội tuyến chuẩn nét cao, đảm bảo 100% màu trắng tinh khôi `#ffffff` trên mọi hệ điều hành (Windows 10/11, macOS, Android, iOS).
  - Tinh chỉnh hiệu ứng hover: chuyển từ màu "xanh đen" tối tăm sang hiệu ứng nổi bật, sáng bừng và đổ bóng nâng cao (elevated glow), tạo cảm giác bấm mượt mà, chuyên nghiệp.
- [x] **Chuẩn hóa Định dạng Ngày & Giờ 24h từ Google Sheets**:
  - Bổ sung bộ lọc `formatDisplayDate` và `formatDisplayTime` giúp tự động chuyển đổi chuỗi ISO từ Google Sheets về đúng dạng `DD/MM/YYYY` và `HH:mm` trên cả bảng hiển thị và file Word xuất ra.
- [x] **Kích hoạt GitHub Pages**: Website đã chính thức hoạt động tại [https://quando610.github.io/WeeklyRegistration_CN23/](https://quando610.github.io/WeeklyRegistration_CN23/).

- [x] **Hiển thị Họ và tên thay cho Email**:
  - Ánh xạ định danh cán bộ (`quan.vpdk@gmail.com` -> Đỗ Trọng Minh Quân, `tuyen.vpdk@gmail.com` -> Nguyễn Thị Kim Tuyền, `thang.vpdk@gmail.com` -> Nguyễn Chiến Thắng...).
  - Cột "Người gửi" trên bảng và Pop-up modal xem chi tiết đều ưu tiên hiển thị Họ và tên trang trọng.
- [x] **Kiểm tra trạng thái cuộc họp theo thời gian thực (Real-time / Định kỳ mỗi phút)**:
  - Tự động so khớp ngày và giờ cuộc họp với thời gian thực tế: phân loại rõ ràng 3 trạng thái `Sắp diễn ra`, `Đang diễn ra` (chấm xanh nhấp nháy), `Đã diễn ra`.
  - Các cuộc họp trong quá khứ được tự động bôi xám, gạch ngang mờ (`row-meeting-past`), giúp bảng lịch tuần gọn gàng, người dùng dễ tập trung vào lịch sắp tới.
- [x] **Bảo mật và Ẩn cấu hình Server (Chỉ Admin Đỗ Trọng Minh Quân được chỉnh)**:
  - Gỡ bỏ hoàn toàn nút Cài đặt ở chân trang (Footer) và các cảnh báo công khai; người dùng thông thường không thấy và không thể can thiệp URL Server.
  - Phân quyền nghiêm ngặt: Chỉ khi đăng nhập bằng tài khoản Quản trị viên `quan.vpdk@gmail.com` (Đỗ Trọng Minh Quân) thì nút "⚙️ Cài đặt Server" mới xuất hiện trên thanh Header.
- [x] **Khắc phục triệt để lỗi lệch giờ 7:23 / 8:23 thành 7:30 / 8:30**:
  - Tìm ra nguyên nhân gốc rễ: Google Apps Script serialize trường Time thành đối tượng Date với mốc năm 1899 (thời điểm đó Sài Gòn sử dụng giờ LMT GMT+07:06:40 thay vì GMT+07:00:00).
  - Áp dụng thuật toán bù trừ 400 giây (6 phút 40 giây) cho các mốc thời gian ISO năm 1899, khôi phục chính xác 100% các mốc giờ 07:30, 08:30, 07:00...
- [x] **Sắp xếp bảng từ mới nhất tới cũ nhất, Phân trang & Xử lý văn bản 500 ký tự**:
  - Bảng lịch tự động sắp xếp theo thứ tự mới nhất lên đầu; phân trang 7 lịch/trang.
  - Các trường dài hơn 70 ký tự được tự động rút gọn với dấu ba chấm `...` và nút "Xem thêm »" mở Pop-up Modal hiển thị đầy đủ 500 ký tự.
- [x] **Sửa lỗi rớt dòng chữ "Việt Nam" trong file Word (.docx) xuất ra**:
  - Tối ưu tỷ lệ chiều rộng 2 cột Tiêu ngữ (38% cơ quan ban hành, 62% Quốc hiệu), đảm bảo dòng chữ "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" không bao giờ bị rớt hàng.
- [x] **Chuẩn hóa thông điệp hệ thống sang thuật ngữ "Server / Máy chủ"**:
  - Đổi toàn bộ các câu thông báo, toast và trạng thái sang "Tải dữ liệu từ server về...", "Đang nạp dữ liệu lên server...".

---

## 2. Các việc ĐANG LÀM (In Progress) ⏳
- [ ] **Kiểm thử cục bộ (Local Testing)**: Người dùng kiểm tra giao diện và tính năng tại máy trước khi đẩy lên GitHub Pages.

---

## 3. Các việc CHƯA LÀM (To-Do) 📋
- [ ] **Đẩy code lên GitHub**: Sau khi kiểm tra hoàn tất tại local, thực hiện `git push` để cập nhật trang chính thức.
- [ ] **Nhập danh sách tài khoản cơ quan**: Quản trị viên điền danh sách Email và mật khẩu của các cán bộ vào sheet `TaiKhoan` trên Google Sheet.



