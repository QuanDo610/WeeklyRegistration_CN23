/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: HỆ THỐNG ĐĂNG KÝ LỊCH TUẦN VPĐK
 * =========================================================================
 * Hướng dẫn:
 * 1. Mở một trang Google Sheet mới (đặt tên: "Đăng Ký Lịch Tuần VPĐK").
 * 2. Vào menu "Tiện ích mở rộng" (Extensions) -> chọn "Apps Script".
 * 3. Xoá hết code cũ trong file Code.gs, dán toàn bộ đoạn mã này vào.
 * 4. Bấm "Lưu" (biểu tượng đĩa mềm hoặc Ctrl+S).
 * 5. Bấm nút "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment).
 *    - Loại: Chọn "Ứng dụng web" (Web App).
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone).
 * 6. Bấm "Triển khai" -> Cấp quyền cho Google Sheet -> Copy đường dẫn "URL ứng dụng web".
 * 7. Dán URL này vào phần Cài đặt của Website (file app.js).
 * =========================================================================
 */

const SHEET_SCHEDULE = "LichTuan";
const SHEET_USERS = "TaiKhoan";

/**
 * Khởi tạo các Sheet và tiêu đề cột nếu chưa có
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tạo Sheet Lịch tuần
  let sheetSchedule = ss.getSheetByName(SHEET_SCHEDULE);
  if (!sheetSchedule) {
    sheetSchedule = ss.insertSheet(SHEET_SCHEDULE);
    sheetSchedule.appendRow([
      "ID",
      "Thời điểm gửi",
      "Email người đăng ký",
      "Ngày (DD/MM/YYYY)",
      "Thứ",
      "Thời điểm làm việc",
      "Nội dung làm việc",
      "Thành phần",
      "Địa điểm"
    ]);
    sheetSchedule.getRange("A1:I1").setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
    sheetSchedule.setFrozenRows(1);
    sheetSchedule.autoResizeColumns(1, 9);
  }

  // 2. Tạo Sheet Danh sách Tài khoản
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(["Email (Gmail)", "Mật khẩu", "Họ và tên", "Chức danh / Đơn vị", "Ghi chú"]);
    sheetUsers.getRange("A1:E1").setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    sheetUsers.setFrozenRows(1);
    
    // Thêm các tài khoản mặc định mẫu
    sheetUsers.appendRow(["tuyen.vpdk@gmail.com", "123456", "Nguyễn Thị Kim Tuyền", "Tổ Hành chính - Tổng hợp", "Admin quản lý"]);
    sheetUsers.appendRow(["nhanvien@gmail.com", "123456", "Nhân viên VPĐK", "Chi nhánh VPĐK số 23", "Người đăng ký"]);
    sheetUsers.autoResizeColumns(1, 5);
  }
}

/**
 * Xử lý yêu cầu GET (Lấy dữ liệu danh sách lịch, danh sách tài khoản)
 */
function doGet(e) {
  try {
    initSheets();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getSchedule";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "getSchedule") {
      const sheet = ss.getSheetByName(SHEET_SCHEDULE);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return createJsonResponse({ success: true, data: [] });
      }
      
      const rows = [];
      // Lấy từ hàng 2 bỏ qua tiêu đề
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0] && !row[2]) continue; // Hàng rỗng
        rows.push({
          id: row[0],
          timestamp: row[1],
          email: row[2],
          date: row[3],
          dayOfWeek: row[4],
          time: row[5],
          content: row[6],
          attendees: row[7],
          location: row[8]
        });
      }
      return createJsonResponse({ success: true, data: rows });
    }

    return createJsonResponse({ success: true, message: "Hệ thống Đăng ký Lịch tuần VPĐK đang hoạt động bình thường!" });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * Xử lý yêu cầu POST (Đăng nhập, Đăng ký lịch mới)
 */
function doPost(e) {
  try {
    initSheets();
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "register";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Chức năng Kiểm tra ĐĂNG NHẬP
    if (action === "login") {
      const email = (payload.email || "").trim().toLowerCase();
      const password = (payload.password || "").trim();

      if (!email || !password) {
        return createJsonResponse({ success: false, message: "Vui lòng nhập đầy đủ Email và Mật khẩu!" });
      }

      const sheetUsers = ss.getSheetByName(SHEET_USERS);
      const data = sheetUsers.getDataRange().getValues();
      let authenticated = false;
      let userInfo = null;

      for (let i = 1; i < data.length; i++) {
        const rowEmail = (data[i][0] || "").toString().trim().toLowerCase();
        const rowPass = (data[i][1] || "").toString().trim();
        if (rowEmail === email && rowPass === password) {
          authenticated = true;
          userInfo = {
            email: data[i][0],
            name: data[i][2] || data[i][0],
            department: data[i][3] || "",
            role: (data[i][4] && data[i][4].includes("Admin")) ? "admin" : "user"
          };
          break;
        }
      }

      if (authenticated) {
        return createJsonResponse({ success: true, message: "Đăng nhập thành công!", user: userInfo });
      } else {
        return createJsonResponse({ success: false, message: "Email hoặc mật khẩu không chính xác!" });
      }
    }

    // 2. Chức năng ĐĂNG KÝ LỊCH TUẦN MỚI
    if (action === "register") {
      const email = (payload.email || "").trim();
      const date = (payload.date || "").trim();
      const dayOfWeek = (payload.dayOfWeek || "").trim();
      const time = (payload.time || "").trim();
      const content = (payload.content || "").trim();
      const attendees = (payload.attendees || "").trim();
      const location = (payload.location || "").trim();

      // Kiểm tra đầy đủ thông tin bắt buộc
      if (!date || !dayOfWeek || !time || !content || !attendees || !location) {
        return createJsonResponse({ 
          success: false, 
          message: "Vui lòng điền đầy đủ tất cả các ô thông tin đăng ký!" 
        });
      }

      // Giới hạn 500 ký tự
      if (content.length > 500 || attendees.length > 500 || location.length > 500) {
        return createJsonResponse({ 
          success: false, 
          message: "Các ô nội dung, thành phần, địa điểm không được vượt quá 500 ký tự!" 
        });
      }

      const sheetSchedule = ss.getSheetByName(SHEET_SCHEDULE);
      const now = new Date();
      const formattedTimestamp = Utilities.formatDate(now, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm:ss");
      const id = "LT-" + now.getTime();

      sheetSchedule.appendRow([
        id,
        formattedTimestamp,
        email,
        date,
        dayOfWeek,
        time,
        content,
        attendees,
        location
      ]);

      return createJsonResponse({ 
        success: true, 
        message: "Đăng ký lịch công tác thành công!", 
        id: id 
      });
    }

    return createJsonResponse({ success: false, message: "Hành động (action) không hợp lệ!" });
  } catch (error) {
    return createJsonResponse({ success: false, message: "Lỗi máy chủ: " + error.toString() });
  }
}

/**
 * Trả về phản hồi dạng JSON hỗ trợ đầy đủ CORS cho Web
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
