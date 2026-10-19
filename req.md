# Yêu cầu hệ thống: Website "Đăng ký Lịch tuần VPĐK"

## 1. Mục đích
- Xây dựng Website **"Đăng ký lịch tuần"** hoạt động trên mọi nền tảng (Windows 10, Windows 11, macOS, Điện thoại di động) qua trình duyệt web (Chrome, Edge, Cốc Cốc, Safari...).
- **Đồng thời (Multi-user)**: Nhiều người có thể mở website này và đăng ký lịch làm việc của mình tại cùng một thời điểm mà không bị xung đột.
- **Dữ liệu tập trung**: Dữ liệu được lưu trữ tự động trên **Google Sheets** (miễn phí, không cần thuê máy chủ server, lãnh đạo hoặc chị Tuyền có thể mở xem trực tiếp trên Google Drive).
- **Xuất file Word**: Chị Tuyền hoặc người dùng bấm nút **"Xuất Lịch tuần Word"** sẽ tải ngay file Word (.docx) theo đúng mẫu lịch công tác tuần của VPĐK, tuân thủ thể thức Nghị định 30/2020/NĐ-CP.

---

## 2. Kiến trúc & Công nghệ (Tối giản - 100% Miễn phí - Không cần duy trì Server)
- **Frontend (Giao diện)**: HTML5 + CSS3 + Vanilla JavaScript thuần (chạy ngay trên trình duyệt, không cần Node.js hay build tool).
- **Lưu trữ & Backend**: Google Sheets + Google Apps Script Web App (chịu tải đồng thời, bảo mật, miễn phí vĩnh viễn).
- **Hosting**: Hỗ trợ triển khai 1-click lên **Cloudflare Pages** (hoặc GitHub Pages) hoàn toàn miễn phí.
- **Xuất Word**: Tạo file `.docx` trực tiếp trên trình duyệt, định dạng chuẩn thể thức văn bản hành chính (Nghị định 30/2020/NĐ-CP).

---

## 3. Yêu cầu chi tiết các chức năng

### 3.1. Giao diện Đăng nhập (Login)
- Dùng **Gmail** của các cá nhân (được cơ quan cung cấp) để làm tên tài khoản.
- Mỗi Gmail được cấp một **Mật khẩu**; khi đăng nhập người dùng phải nhập đúng mật khẩu này.
- Các thành phần trên giao diện:
  - Ô "Email" (Gmail cá nhân).
  - Ô "Mật khẩu" (Password).
  - Nút "Đăng nhập": Kiểm tra thông tin; đúng thì chuyển vào màn hình Đăng ký, sai thì hiển thị thông báo lỗi rõ ràng.
  - Tùy chọn "Ghi nhớ đăng nhập" (tiện lợi cho lần đăng ký sau không cần gõ lại).

### 3.2. Giao diện sau khi Đăng nhập ("Thông tin đăng ký")
Hiển thị giao diện đăng ký với các trường thông tin:
1. **"Ngày / Tháng / Năm"** (DD/MM/YYYY): Người dùng chọn hoặc nhập ngày.
2. **"Thứ"**: **Tự động điền** ngay khi người dùng chọn ngày (ví dụ: Thứ Hai, Thứ Ba...).
3. **"Thời điểm"**: Chuỗi ký tự (ví dụ: `14h30`, `08h00 - Sáng`,...).
4. **"Nội dung làm việc"**: Cho phép nhập tối đa khoảng 500 ký tự (có bộ đếm ký tự trực quan).
5. **"Thành phần"**: Cho phép nhập tối đa khoảng 500 ký tự.
6. **"Địa điểm"**: Cho phép nhập tối đa khoảng 500 ký tự.
7. **Nút "Đăng ký"**:
   - Kiểm tra hợp lệ (bắt buộc nhập đủ các ô trên).
   - Nếu chưa nhập đủ: Thông báo lỗi yêu cầu người dùng bổ sung.
   - Nếu nhập đủ: Gửi dữ liệu về Google Sheets và thông báo thành công.

### 3.3. Bảng xem lịch & Nút "Xuất Lịch tuần Word"
- Hiển thị danh sách các lịch đã được các cá nhân đăng ký trong tuần.
- **Nút "Xuất Lịch tuần Word"**: Cho phép tải về file `.docx` chứa bảng lịch công tác tuần hoàn chỉnh, tổng hợp toàn bộ dữ liệu của những người đã đăng ký, định dạng font Times New Roman cỡ 13-14, căn lề và tiêu ngữ theo Nghị định 30.
