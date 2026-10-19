# Hệ Thống Đăng Ký Lịch Công Tác Tuần - VPĐK (Chi Nhánh Số 23)

Ứng dụng web trực tuyến hỗ trợ đăng ký lịch công tác tuần dành cho cán bộ, viên chức và người lao động thuộc Chi nhánh Văn phòng Đăng ký đất đai, lưu trữ tập trung trên Google Sheets và xuất file Word chuẩn Nghị định 30/2020/NĐ-CP.

🌐 **Website Trực Tuyến (GitHub Pages):** [https://quando610.github.io/WeeklyRegistration_CN23/](https://quando610.github.io/WeeklyRegistration_CN23/)

---

## 📌 Tính Năng Nổi Bật

1. **Đăng nhập cá nhân hóa**:
   - Sử dụng tài khoản Gmail được cấp và mật khẩu bảo vệ.
   - Hỗ trợ ghi nhớ đăng nhập tiện lợi.
2. **Form đăng ký chuẩn hóa**:
   - **Tự động tính "Thứ"** theo ngày chọn (DD/MM/YYYY).
   - Chọn nhanh các khung thời gian thường dùng (`08h00`, `14h00`, `14h30`...).
   - Bộ đếm trực quan **giới hạn 500 ký tự** cho các ô Nội dung, Thành phần, Địa điểm.
   - Kiểm tra ràng buộc nhập đầy đủ dữ liệu trước khi đăng ký.
3. **Lưu trữ Serverless (Google Sheets)**:
   - Dữ liệu nhảy thẳng vào bảng tính Google Sheets của đơn vị theo thời gian thực.
   - Hỗ trợ nhiều người truy cập và đăng ký cùng một thời điểm mà không xung đột.
4. **Xuất file Word (.docx) chuẩn thể thức hành chính**:
   - Chị Tuyền hoặc người dùng bấm **"Xuất Lịch tuần Word"** là file `.docx` được tạo và tải về máy ngay tức thì.
   - Chuẩn thể thức **Nghị định 30/2020/NĐ-CP**: Khổ giấy A4, lề chuẩn (Trái 30mm, Phải 15mm, Trên 20mm, Dưới 20mm), phông Times New Roman cỡ 13-14, tiêu ngữ, đường kẻ và bảng phân công công tác tuần.

---

## 📁 Cấu Trúc Mã Nguồn

```text
├── index.html              # Giao diện chính hệ thống (Login, Form đăng ký, Bảng lịch tuần)
├── style.css               # Phong cách giao diện responsive, trang nhã chuẩn cơ quan nhà nước
├── app.js                  # Logic ứng dụng (tính thứ tự động, lưu trữ, xuất Word docx)
├── google_apps_script.js   # Script backend dán vào Google Sheet để kết nối API
├── HD_TRIEN_KHAI.md        # Hướng dẫn chi tiết kết nối Google Sheet & kích hoạt GitHub Pages
├── req.md                  # Tài liệu yêu cầu kỹ thuật hệ thống
└── task.md                 # Nhật ký theo dõi tiến độ công việc
```

---

## ⚙️ Hướng Dẫn Kích Hoạt GitHub Pages

1. Vào repository trên GitHub: [QuanDo610/WeeklyRegistration_CN23](https://github.com/QuanDo610/WeeklyRegistration_CN23).
2. Vào **Settings** -> Mục **Pages** (ở cột bên trái).
3. Tại phần **Build and deployment** -> **Branch**: Chọn nhánh `main` (thư mục `/ (root)`).
4. Bấm **Save**. 
5. Sau 1 phút, trang web sẽ chính thức hoạt động tại:
   👉 **`https://quando610.github.io/WeeklyRegistration_CN23/`**

---

## 📋 Tài Khoản Để Kiểm Thử
- **Đỗ Trọng Minh Quân (Quản trị viên)**: `quan.vpdk@gmail.com` / Mật khẩu: `123456`
- **Nguyễn Thị Bích Tuyền**: `tuyen.vpdk@gmail.com` / Mật khẩu: `123456`
- **Nhân viên**: `nhanvien@gmail.com` / Mật khẩu: `123456`
