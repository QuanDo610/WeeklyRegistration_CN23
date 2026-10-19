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

- [x] **Khởi tạo và đẩy mã nguồn lên GitHub**: Đã đẩy thành công toàn bộ mã nguồn lên repository [WeeklyRegistration_CN23](https://github.com/QuanDo610/WeeklyRegistration_CN23.git) trên nhánh `main`.
- [x] **Nâng cấp Giao diện tương phản cao & Dropdown thời gian 24h**:
  - Tối ưu màu sắc toàn bộ nút bấm: Nền tối chữ trắng (Nút Đăng ký, Làm mới biểu mẫu, Làm mới danh sách, Xuất Word).
  - Chuyển đổi chọn Thời điểm sang Dropdown chuẩn hệ thống 24h (các mốc 30 phút từ `07:30 - 11:30` và `13:00 - 17:00`, kèm tùy chọn tự nhập nếu có mốc đặc biệt), loại bỏ hiển thị Sáng/Chiều theo đúng thực tế giờ làm việc.

---

## 2. Các việc ĐANG LÀM (In Progress) ⏳
- [ ] **Kích hoạt GitHub Pages**: Bật GitHub Pages trên nhánh `main` trong Settings repo để link web hoạt động toàn cầu.

---

## 3. Các việc CHƯA LÀM (To-Do) 📋
- [ ] **Tạo trang tính Google Sheets và dán Apps Script**: Triển khai theo [HD_TRIEN_KHAI.md](file:///Users/admin/Desktop/BINHDUONG/A_THANG/HD_TRIEN_KHAI.md) và kết nối với Web qua nút Cài đặt.


