# HƯỚNG DẪN TRIỂN KHAI WEBSITE "ĐĂNG KÝ LỊCH TUẦN VPĐK"
*(Mô hình Serverless: Miễn phí 100% vĩnh viễn – Không tốn tài nguyên máy chủ)*

---

## I. KIỂM THỬ NHANH TRÊN MÁY TÍNH (KHÔNG CẦN CÀI ĐẶT GÌ)
Bạn có thể dùng thử ngay lập tức mà chưa cần cấu hình mạng:
1. Mở thư mục `A_THANG`.
2. **Nhấp đúp chuột vào file `index.html`** để mở trên trình duyệt (Chrome, Edge, Cốc Cốc, Cốc Cốc).
3. Đăng nhập bằng tài khoản:
   - **Tài khoản Đỗ Trọng Minh Quân (Quản trị viên)**: `quan.vpdk@gmail.com` / Mật khẩu: `123456`
   - **Tài khoản Nguyễn Thị Bích Tuyền**: `tuyen.vpdk@gmail.com` / Mật khẩu: `123456`
   - **Tài khoản Nhân viên**: `nhanvien@gmail.com` / Mật khẩu: `123456`
4. Trải nghiệm các tính năng:
   - Chọn ngày: Ô "Thứ" sẽ **tự động tính và điền**.
   - Nhập thời điểm, nội dung, thành phần, địa điểm (có bộ đếm trực quan 500 ký tự).
   - Bấm **"➕ Đăng Ký Lịch Này"** -> Dữ liệu cập nhật vào bảng.
   - Bấm **"📄 Xuất Lịch tuần Word"** -> Trình duyệt sẽ xuất và tải ngay file `.docx` định dạng chuẩn thể thức Nghị định 30/2020/NĐ-CP về máy tính.

---

## II. KẾT NỐI VỚI GOOGLE SHEETS (ĐỂ LƯU DỮ LIỆU TẬP TRUNG ONLINE)
Để toàn bộ người dùng đăng ký và dữ liệu nhảy trực tiếp vào 1 trang tính Google Sheet cho Chị Tuyền hoặc Ban Giám đốc quản lý:

### Bước 1: Tạo Google Sheet mới
1. Truy cập [sheets.new](https://sheets.new) để tạo một trang tính Google mới.
2. Đặt tên trang tính: **"Lịch Công Tác Tuần - VPĐK"**.

### Bước 2: Dán mã Google Apps Script
1. Trên thanh menu của Google Sheet, chọn: **Tiện ích mở rộng** (Extensions) -> **Apps Script**.
2. Xoá hết mã có sẵn trong khung soạn thảo.
3. Mở file [google_apps_script.js](file:///Users/admin/Desktop/BINHDUONG/A_THANG/google_apps_script.js), sao chép (Copy) toàn bộ nội dung và dán (Paste) vào khung Apps Script.
4. Bấm biểu tượng **Lưu** (Đĩa mềm) hoặc phím tắt `Ctrl + S`.

### Bước 3: Triển khai thành Web App
1. Bấm nút màu xanh **"Triển khai" (Deploy)** ở góc trên bên phải -> chọn **"Tùy chọn triển khai mới" (New deployment)**.
2. Nhấp vào biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại", chọn **"Ứng dụng web" (Web app)**.
3. Thiết lập 3 mục sau:
   - **Mô tả**: *Lịch tuần VPĐK*
   - **Thực thi dưới dạng (Execute as)**: Chọn **"Tôi" (Me - your_email@gmail.com)**.
   - **Ai có quyền truy cập (Who has access)**: Chọn **"Bất kỳ ai" (Anyone)**. *(Rất quan trọng để mọi người gửi dữ liệu được)*.
4. Bấm **"Triển khai" (Deploy)**.
5. Google sẽ yêu cầu "Ủy quyền truy cập" (Authorize access):
   - Đăng nhập vào tài khoản Gmail của bạn.
   - Nếu thấy cảnh báo "Google chưa xác minh ứng dụng này", chọn **Nâng cao (Advanced)** -> Chọn tiếp **"Đi tới ... (không an toàn)"**.
   - Bấm **Cho phép (Allow)**.
6. Sau khi hoàn tất, Google sẽ hiện một hộp thoại chứa:
   - **URL ứng dụng web** (có dạng: `https://script.google.com/macros/s/AKfycb.../exec`).
   - Hãy **Sao chép (Copy) đường link này**.

### Bước 4: Kích hoạt trên Website
1. Mở website `index.html`.
2. Đăng nhập vào và bấm nút **"⚙️ Cài đặt Sheet"** trên góc phải màn hình.
3. Dán link vừa copy vào ô **"Google Apps Script Web App URL"**.
4. Bấm **"Kiểm tra kết nối"** -> Khi hiện đèn xanh báo thành công thì bấm **"Lưu cấu hình"**.
*(Từ thời điểm này, bất kỳ ai đăng ký trên web, dữ liệu sẽ ghi trực tiếp vào Google Sheet ngay tức thì).*

---

## III. KÍCH HOẠT GITHUB PAGES (MIỄN PHÍ 100% - CHẠY TRỰC TIẾP TỪ REPO)
Sau khi mã nguồn đã được đẩy lên GitHub repo [WeeklyRegistration_CN23](https://github.com/QuanDo610/WeeklyRegistration_CN23):

1. Mở trình duyệt và truy cập trang cài đặt repo:
   👉 **https://github.com/QuanDo610/WeeklyRegistration_CN23/settings/pages**
2. Tại mục **"Build and deployment"**:
   - **Source**: Chọn **Deploy from a branch**.
   - **Branch**: Chọn nhánh **`main`** và thư mục **`/ (root)`**.
3. Bấm **Save**.
4. Chờ khoảng 30 - 60 giây, GitHub Pages sẽ kích hoạt đường link website chính thức:
   👉 **`https://quando610.github.io/WeeklyRegistration_CN23/`**
5. Bạn gửi đường link này cho Chị Tuyền và các cá nhân trong cơ quan để mọi người truy cập và đăng ký lịch tuần trên máy tính hoặc điện thoại!

---

## IV. BẢO MẬT & QUẢN LÝ TÀI KHOẢN
- Toàn bộ danh sách tài khoản (Email, Mật khẩu, Họ tên) được lưu trực tiếp tại Sheet **`TaiKhoan`** trên file Google Sheet của bạn.
- Bạn có thể thêm hàng mới, đổi mật khẩu hoặc xoá tài khoản bất cứ lúc nào trực tiếp trên Google Sheet mà không cần sửa code.

