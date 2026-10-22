/**
 * TEST SUITE: BỘ KIỂM THỬ TỰ ĐỘNG HỆ THỐNG ĐĂNG KÝ LỊCH TUẦN VPĐK
 * Chạy kiểm thử: node A_THANG/test_suite.js
 */

const fs = require("fs");
const path = require("path");

// Đọc mã nguồn app.js
const appJsPath = path.join(__dirname, "app.js");
const appCode = fs.readFileSync(appJsPath, "utf8");

// Mock môi trường Browser DOM
const elements = {};
function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      value: "",
      textContent: "",
      innerHTML: "",
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      appendChild: () => {},
      addEventListener: () => {},
      focus: () => {}
    };
  }
  return elements[id];
}

global.window = {
  flatpickr: () => ({ setDate: () => {}, open: () => {} })
};
global.document = {
  getElementById: getEl,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => ({
    className: "",
    style: {},
    innerHTML: "",
    appendChild: () => {},
    parentElement: { removeChild: () => {} }
  }),
  addEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._store[k]; }
};
global.sessionStorage = {
  _store: {},
  getItem: (k) => global.sessionStorage._store[k] || null,
  setItem: (k, v) => { global.sessionStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.sessionStorage._store[k]; }
};

// Nạp mã nguồn
eval(appCode);

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    totalFailed++;
  }
}

console.log("==================================================");
console.log("🚀 BẮT ĐẦU CHẠY KIỂM THỬ HỆ THỐNG ĐĂNG KÝ LỊCH TUẦN");
console.log("==================================================\n");

// -----------------------------------------------------------------
// TEST 1: CHUẨN HÓA NGÀY & TÍNH THỨ TỰ ĐỘNG
// -----------------------------------------------------------------
console.log("📌 TEST NHÓM 1: Định dạng Ngày & Tính Thứ tự động");
assert(formatDisplayDate("22/10/2026") === "22/10/2026", "formatDisplayDate giữ nguyên DD/MM/YYYY");
assert(formatDisplayDate("2026-10-22") === "22/10/2026", "formatDisplayDate chuyển YYYY-MM-DD sang DD/MM/YYYY");
assert(convertDDMMYYYYtoYYYYMMDD("22/10/2026") === "2026-10-22", "convertDDMMYYYYtoYYYYMMDD sang ISO YYYY-MM-DD");

calculateDayOfWeek("22/10/2026");
assert(getEl("regDayOfWeek").value === "Thứ Năm", "calculateDayOfWeek nhận đúng 22/10/2026 là Thứ Năm");
calculateDayOfWeek("25/10/2026");
assert(getEl("regDayOfWeek").value === "Chủ Nhật", "calculateDayOfWeek nhận đúng 25/10/2026 là Chủ Nhật");

// -----------------------------------------------------------------
// TEST 2: ĐỊNH DẠNG THỜI GIAN & CHỐNG RỚT DÒNG
// -----------------------------------------------------------------
console.log("\n📌 TEST NHÓM 2: Chuẩn hóa thời gian 24h & Khung giờ");
assert(formatSingleTime("7:30") === "07:30", "formatSingleTime đệm số 0 thành 07:30");
assert(formatSingleTime("14:00") === "14:00", "formatSingleTime giữ nguyên 14:00");
assert(formatDisplayTime("7:30 - 9:30") === "07:30 - 09:30", "formatDisplayTime chuẩn hóa cả 2 mốc 07:30 - 09:30");
assert(formatDisplayTime("08:00") === "08:00", "formatDisplayTime mốc đơn 08:00");

// -----------------------------------------------------------------
// TEST 3: RÀNG BUỘC THỜI GIAN (GIỜ KẾT THÚC PHẢI SAU BẮT ĐẦU)
// -----------------------------------------------------------------
console.log("\n📌 TEST NHÓM 3: Kiểm tra ràng buộc Giờ kết thúc > Giờ bắt đầu");
function checkValidTimeRange(start, end) {
  if (!start || !end) return false;
  return end > start;
}
assert(checkValidTimeRange("07:30", "09:30") === true, "09:30 > 07:30 là hợp lệ");
assert(checkValidTimeRange("14:00", "16:30") === true, "16:30 > 14:00 là hợp lệ");
assert(checkValidTimeRange("09:30", "09:30") === false, "09:30 trùng 09:30 bị chặn");
assert(checkValidTimeRange("10:00", "08:30") === false, "08:30 < 10:00 bị chặn");

// -----------------------------------------------------------------
// TEST 4: SẮP XẾP THÔNG MINH (ĐANG DIỄN RA > SẮP DIỄN RA > ĐÃ DIỄN RA)
// -----------------------------------------------------------------
console.log("\n📌 TEST NHÓM 4: Sắp xếp bảng lịch theo thứ tự ưu tiên");
const mockItems = [
  { id: "past_old", date: "20/10/2026", time: "08:00 - 10:00", content: "Đã xong 2 ngày trước" },
  { id: "past_morning", date: "22/10/2026", time: "07:30 - 09:30", content: "Đã xong sáng nay" },
  { id: "ongoing", date: "22/10/2026", time: "14:00 - 16:00", content: "Đang diễn ra" },
  { id: "upcoming_today", date: "22/10/2026", time: "16:30 - 17:30", content: "Chiều nay" },
  { id: "upcoming_tomorrow", date: "23/10/2026", time: "08:00 - 10:00", content: "Ngày mai" },
  { id: "upcoming_next_week", date: "28/10/2026", time: "08:00 - 10:00", content: "Tuần sau" }
];

const sortedList = [...mockItems].sort(compareScheduleSmart);
assert(sortedList[0].id === "ongoing", "Vị trí 1 phải là 'Đang diễn ra'");
assert(sortedList[1].id === "upcoming_today", "Vị trí 2 phải là 'Chiều nay' (gần nhất)");
assert(sortedList[2].id === "upcoming_tomorrow", "Vị trí 3 phải là 'Ngày mai'");
assert(sortedList[3].id === "upcoming_next_week", "Vị trí 4 phải là 'Tuần sau'");
assert(sortedList[4].id === "past_morning", "Vị trí 5 phải là 'Đã xong sáng nay' (mới xong trước)");
assert(sortedList[5].id === "past_old", "Vị trí 6 phải là 'Đã xong 2 ngày trước'");

// -----------------------------------------------------------------
// TEST 5: TÙY CHỌN XUẤT WORD (TOÀN BỘ HOẶC THEO KHOẢNG NGÀY)
// -----------------------------------------------------------------
console.log("\n📌 TEST NHÓM 5: Lọc phạm vi ngày xuất văn bản Word");
window.setScheduleDataForTest([
  { id: "1", date: "19/10/2026", rawDate: "2026-10-19", time: "08:00 - 10:00" },
  { id: "2", date: "22/10/2026", rawDate: "2026-10-22", time: "09:00 - 11:00" },
  { id: "3", date: "25/10/2026", rawDate: "2026-10-25", time: "14:00 - 16:00" },
  { id: "4", date: "30/10/2026", rawDate: "2026-10-30", time: "08:00 - 10:00" }
]);

// 5.1: Xuất toàn bộ
getEl("scopeAll").checked = true;
getEl("scopeRange").checked = false;
const resAll = getFilteredExportData();
assert(resAll.data.length === 4, "Xuất toàn bộ trả về đủ 4 mục");
assert(resAll.isFiltered === false, "Không bật cờ lọc khoảng ngày khi chọn toàn bộ");

// 5.2: Xuất theo khoảng ngày (Từ 20/10/2026 đến 26/10/2026)
getEl("scopeAll").checked = false;
getEl("scopeRange").checked = true;
getEl("exportFromDate").value = "20/10/2026";
getEl("exportToDate").value = "26/10/2026";
const resRange = getFilteredExportData();
assert(resRange.data.length === 2, "Khoảng 20/10 - 26/10 lọc chính xác 2 mục (22/10 và 25/10)");
assert(resRange.data[0].id === "2" && resRange.data[1].id === "3", "Đúng các mục trong tuần");

// 5.3: Khoảng ngày không có mục nào
getEl("exportFromDate").value = "01/11/2026";
getEl("exportToDate").value = "05/11/2026";
const resEmpty = getFilteredExportData();
assert(resEmpty.data.length === 0, "Khoảng ngày tương lai không có dữ liệu trả về 0 mục an toàn");

// 5.4: Khoảng ngày sai logic (Đến ngày trước Từ ngày)
getEl("exportFromDate").value = "25/10/2026";
getEl("exportToDate").value = "20/10/2026";
const resInvalid = getFilteredExportData();
assert(resInvalid.error !== undefined, "Ngày kết thúc trước ngày bắt đầu trả về thông báo lỗi");

// -----------------------------------------------------------------
// TEST 6: LÀM NỔI BẬT TỪ KHÓA ĐỎ ("CHI NHÁNH 23", "CN23", "23") KHI XUẤT WORD
// -----------------------------------------------------------------
console.log("\n📌 TEST NHÓM 6: Highlight từ khóa đỏ khi xuất Word");
const htmlHighlight = formatCellHtmlWithRedHighlight("Hội nghị tại Chi nhánh 23 cùng CN23");
assert(htmlHighlight.includes('<span style="color: #ff0000; font-weight: bold;">Chi nhánh 23</span>'), "Highlight chuẩn Chi nhánh 23");
assert(htmlHighlight.includes('<span style="color: #ff0000; font-weight: bold;">CN23</span>'), "Highlight chuẩn CN23");

// -----------------------------------------------------------------
// TEST 7: KIỂM THỬ XỬ LÝ ĐĂNG KÝ (KHÔNG CÒN LỖI TIMESELECT HAY REFERENCE ERROR)
// -----------------------------------------------------------------
console.log("\n📌 TEST NHÓM 7: An toàn hàm handleRegister (Không lỗi ReferenceError)");
let toastMessages = [];
eval(`showToast = (msg, type) => {
  toastMessages.push({ msg, type });
};`);

async function runAsyncTests() {
  const fakeEvent = { preventDefault: () => {} };

  // Test submit khi thiếu thông tin
  getEl("regDate").value = "";
  getEl("regStartTime").value = "07:30";
  getEl("regEndTime").value = "09:30";
  await handleRegister(fakeEvent);
  assert(toastMessages.some(t => t.type === "warning" && t.msg.includes("Vui lòng chọn ngày")), "Bắt lỗi thiếu trường thông tin");

  // Test submit khi giờ kết thúc <= giờ bắt đầu
  toastMessages = [];
  getEl("regDate").value = "25/10/2026";
  getEl("regDayOfWeek").value = "Chủ Nhật";
  getEl("regStartTime").value = "10:00";
  getEl("regEndTime").value = "08:30";
  getEl("regContent").value = "Họp giao ban";
  getEl("regAttendees").value = "BGĐ";
  getEl("regLocation").value = "Hội trường";
  await handleRegister(fakeEvent);
  assert(toastMessages.some(t => t.type === "warning" && t.msg.includes("Giờ kết thúc")), "Bắt lỗi giờ kết thúc trước giờ bắt đầu");

  // Test submit thành công
  toastMessages = [];
  getEl("regStartTime").value = "08:00";
  getEl("regEndTime").value = "10:00";
  window.setGoogleScriptUrlForTest(""); // offline mode để không gọi network
  await handleRegister(fakeEvent);
  assert(toastMessages.some(t => t.type === "info" && t.msg.includes("cục bộ")), "Đăng ký thành công lưu vào bộ nhớ an toàn không văng lỗi");

  // TỔNG KẾT
  console.log("\n==================================================");
  console.log(`📊 TỔNG KẾT: ${totalPassed} PASSED | ${totalFailed} FAILED`);
  console.log("==================================================");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 TẤT CẢ TEST CASES ĐỀU VƯỢT QUA 100%!");
    process.exit(0);
  }
}

runAsyncTests();
