/**
 * =========================================================================
 * APP.JS: LOGIC HỆ THỐNG ĐĂNG KÝ LỊCH TUẦN VPĐK
 * =========================================================================
 */

// Key lưu trữ trong trình duyệt
const STORAGE_KEYS = {
  SCRIPT_URL: "vpdk_script_url",
  CURRENT_USER: "vpdk_current_user",
  LOCAL_SCHEDULE: "vpdk_local_schedule_data",
  REMEMBER_EMAIL: "vpdk_remember_email"
};

// Dữ liệu mẫu ban đầu để kiểm thử ngay lập tức nếu chưa nối Google Sheet
const INITIAL_DEMO_SCHEDULE = [
  {
    id: "LT-001",
    timestamp: "19/10/2026 08:30:00",
    email: "tuyen.vpdk@gmail.com",
    date: "20/10/2026",
    rawDate: "2026-10-20",
    dayOfWeek: "Thứ Ba",
    time: "08:30",
    content: "Họp giao ban đầu tuần Tổ Hành chính - Tổng hợp và Chi nhánh số 23",
    attendees: "Ban Giám đốc, Tổ trưởng các Tổ chuyên môn, NV Văn thư",
    location: "Phòng họp số 1 - Trụ sở VPĐK"
  },
  {
    id: "LT-002",
    timestamp: "19/10/2026 09:15:00",
    email: "nhanvien@gmail.com",
    date: "21/10/2026",
    rawDate: "2026-10-21",
    dayOfWeek: "Thứ Tư",
    time: "14:00",
    content: "Kiểm tra thực địa hồ sơ đo đạc cấp GCN quyền sử dụng đất",
    attendees: "Tổ Đo đạc bản đồ, UBND Phường, Chủ sử dụng đất",
    location: "Địa bàn Phường Phú Cường"
  },
  {
    id: "LT-003",
    timestamp: "19/10/2026 10:00:00",
    email: "tuyen.vpdk@gmail.com",
    date: "23/10/2026",
    rawDate: "2026-10-23",
    dayOfWeek: "Thứ Sáu",
    time: "14:30",
    content: "Tổng kết công tác rà soát thủ tục hành chính và số hóa hồ sơ Quý 4",
    attendees: "Toàn thể viên chức và người lao động Chi nhánh",
    location: "Hội trường lầu 2"
  }
];

// Trạng thái ứng dụng
let currentUser = null;
let scheduleData = [];
let googleScriptUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || "";

// ==================== KHỞI CHẠY ỨNG DỤNG ====================
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  bindEvents();
  checkAutoLogin();
});

function initStorage() {
  const existingSchedule = localStorage.getItem(STORAGE_KEYS.LOCAL_SCHEDULE);
  if (!existingSchedule) {
    localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify(INITIAL_DEMO_SCHEDULE));
    scheduleData = [...INITIAL_DEMO_SCHEDULE];
  } else {
    try {
      scheduleData = JSON.parse(existingSchedule);
    } catch (e) {
      scheduleData = [...INITIAL_DEMO_SCHEDULE];
    }
  }

  // Điền URL cấu hình nếu có
  const inputUrl = document.getElementById("googleScriptUrlInput");
  if (inputUrl && googleScriptUrl) {
    inputUrl.value = googleScriptUrl;
    updateConnectionStatusUI(true, "Đã lưu đường link Google Apps Script");
  }

  // Điền sẵn ngày hôm nay vào ô chọn ngày
  const regDateInput = document.getElementById("regDate");
  if (regDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    regDateInput.value = `${yyyy}-${mm}-${dd}`;
    calculateDayOfWeek(regDateInput.value);
  }
}

// ==================== GẮN CÁC SỰ KIỆN ====================
function bindEvents() {
  // Form Đăng nhập
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Đăng xuất
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", handleLogout);
  }

  // Form Đăng ký lịch
  const registerForm = document.getElementById("registerForm");
  const regTimeSelect = document.getElementById("regTimeSelect");
  const regTimeCustom = document.getElementById("regTimeCustom");

  if (regTimeSelect && regTimeCustom) {
    regTimeSelect.addEventListener("change", (e) => {
      if (e.target.value === "custom") {
        regTimeCustom.style.display = "block";
        regTimeCustom.focus();
      } else {
        regTimeCustom.style.display = "none";
        regTimeCustom.value = "";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
    registerForm.addEventListener("reset", () => {
      setTimeout(() => {
        if (regTimeSelect) regTimeSelect.selectedIndex = 0;
        if (regTimeCustom) {
          regTimeCustom.style.display = "none";
          regTimeCustom.value = "";
        }
        document.getElementById("contentCounter").textContent = "0 / 500 ký tự";
        document.getElementById("attendeesCounter").textContent = "0 / 500 ký tự";
        document.getElementById("locationCounter").textContent = "0 / 500 ký tự";
        const regDateInput = document.getElementById("regDate");
        if (regDateInput && regDateInput.value) {
          calculateDayOfWeek(regDateInput.value);
        }
      }, 30);
    });
  }

  // Tính Thứ tự động khi thay đổi ngày
  const regDateInput = document.getElementById("regDate");
  if (regDateInput) {
    regDateInput.addEventListener("change", (e) => {
      calculateDayOfWeek(e.target.value);
    });
  }

  // Đếm ký tự cho các ô giới hạn 500 ký tự
  setupCharCounter("regContent", "contentCounter", 500);
  setupCharCounter("regAttendees", "attendeesCounter", 500);
  setupCharCounter("regLocation", "locationCounter", 500);

  // Xuất file Word
  const btnExportWord = document.getElementById("btnExportWord");
  if (btnExportWord) {
    btnExportWord.addEventListener("click", exportWeeklyScheduleWord);
  }

  // Làm mới bảng danh sách
  const btnRefreshList = document.getElementById("btnRefreshList");
  if (btnRefreshList) {
    btnRefreshList.addEventListener("click", () => {
      loadScheduleList(true);
    });
  }

  // Tìm kiếm bảng
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterScheduleTable(e.target.value);
    });
  }

  // Modal Cấu hình Google Sheet
  const btnOpenConfig = document.getElementById("btnOpenConfig");
  const configModal = document.getElementById("configModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnSaveConfig = document.getElementById("btnSaveConfig");
  const btnTestConnection = document.getElementById("btnTestConnection");

  if (btnOpenConfig && configModal) {
    btnOpenConfig.addEventListener("click", () => {
      configModal.style.display = "flex";
    });
  }

  if (btnCloseModal && configModal) {
    btnCloseModal.addEventListener("click", () => {
      configModal.style.display = "none";
    });
  }

  if (btnSaveConfig) {
    btnSaveConfig.addEventListener("click", saveGoogleScriptConfig);
  }

  if (btnTestConnection) {
    btnTestConnection.addEventListener("click", testGoogleScriptConnection);
  }
}

// ==================== XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ====================
async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById("loginEmail").value.trim().toLowerCase();
  const passwordInput = document.getElementById("loginPassword").value.trim();
  const rememberMe = document.getElementById("rememberMe").checked;

  if (!emailInput || !passwordInput) {
    showToast("Vui lòng nhập đầy đủ Email và Mật khẩu!", "warning");
    return;
  }

  // Kiểm tra đuôi Gmail hợp lệ
  if (!emailInput.includes("@")) {
    showToast("Email không hợp lệ. Vui lòng nhập địa chỉ Gmail!", "warning");
    return;
  }

  const btnLogin = document.getElementById("btnLogin");
  btnLogin.disabled = true;
  btnLogin.innerHTML = "<span>⏳ Đang kiểm tra...</span>";

  try {
    // 1. Nếu có cấu hình Google Apps Script URL -> Gọi API online
    if (googleScriptUrl) {
      try {
        const response = await fetch(googleScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "login",
            email: emailInput,
            password: passwordInput
          })
        });
        const result = await response.json();
        if (result.success) {
          onLoginSuccess(result.user, rememberMe);
          return;
        } else {
          showToast(result.message || "Email hoặc Mật khẩu không đúng!", "error");
          btnLogin.disabled = false;
          btnLogin.innerHTML = "<span>Đăng nhập</span>";
          return;
        }
      } catch (err) {
        console.warn("Không gọi được Google Script, chuyển sang chế độ kiểm tra cục bộ:", err);
      }
    }

    // 2. Chế độ kiểm tra cục bộ (Fallback khi chưa nối Google Sheet hoặc test nhanh)
    if (passwordInput === "123456" || passwordInput.length >= 6) {
      let role = "user";
      let name = "Nhân viên";
      if (emailInput.includes("tuyen") || emailInput.includes("admin")) {
        role = "admin";
        name = "Nguyễn Thị Kim Tuyền";
      } else {
        name = emailInput.split("@")[0].toUpperCase();
      }

      const user = {
        email: emailInput,
        name: name,
        role: role
      };

      onLoginSuccess(user, rememberMe);
    } else {
      showToast("Mật khẩu không đúng (Mật khẩu mặc định là: 123456)!", "error");
      btnLogin.disabled = false;
      btnLogin.innerHTML = "<span>Đăng nhập</span>";
    }
  } catch (error) {
    showToast("Đã có lỗi xảy ra khi đăng nhập: " + error.message, "error");
    btnLogin.disabled = false;
    btnLogin.innerHTML = "<span>Đăng nhập</span>";
  }
}

function onLoginSuccess(user, remember) {
  currentUser = user;
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  showToast(`Xin chào ${user.name}! Đăng nhập thành công.`, "success");
  showWorkspaceUI();
  loadScheduleList();

  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) {
    btnLogin.disabled = false;
    btnLogin.innerHTML = "<span>Đăng nhập</span>";
  }
}

function checkAutoLogin() {
  const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      showWorkspaceUI();
      loadScheduleList();
    } catch (e) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

  document.getElementById("loginSection").style.display = "block";
  document.getElementById("appWorkspace").style.display = "none";
  document.getElementById("headerUserArea").style.display = "none";

  showToast("Bạn đã đăng xuất khỏi hệ thống.", "info");
}

function showWorkspaceUI() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("appWorkspace").style.display = "grid";
  document.getElementById("headerUserArea").style.display = "flex";

  document.getElementById("displayUserName").textContent = currentUser.name || currentUser.email;
  document.getElementById("displayUserEmail").textContent = currentUser.email;
}

// Điền nhanh tài khoản mẫu
window.fillDemo = function(email, password) {
  document.getElementById("loginEmail").value = email;
  document.getElementById("loginPassword").value = password;
  document.getElementById("loginEmail").focus();
};

// ==================== TÍNH TOÁN "THỨ" TỰ ĐỘNG ====================
function calculateDayOfWeek(dateString) {
  if (!dateString) {
    document.getElementById("regDayOfWeek").value = "";
    document.getElementById("formattedDateText").textContent = "Định dạng: DD/MM/YYYY";
    return;
  }

  // Phân tích chuỗi YYYY-MM-DD
  const parts = dateString.split("-");
  if (parts.length !== 3) return;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  const dayOfWeekIndex = dateObj.getDay();

  const daysOfWeek = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy"
  ];

  const calculatedDay = daysOfWeek[dayOfWeekIndex];
  document.getElementById("regDayOfWeek").value = calculatedDay;

  // Hiển thị ngày chuẩn DD/MM/YYYY
  const formattedDay = String(day).padStart(2, '0');
  const formattedMonth = String(month + 1).padStart(2, '0');
  document.getElementById("formattedDateText").textContent = `Ngày: ${formattedDay}/${formattedMonth}/${year} (${calculatedDay})`;
}

// Đếm số lượng ký tự max 500
function setupCharCounter(inputId, counterId, maxLength) {
  const inputEl = document.getElementById(inputId);
  const counterEl = document.getElementById(counterId);
  if (!inputEl || !counterEl) return;

  inputEl.addEventListener("input", () => {
    const len = inputEl.value.length;
    counterEl.textContent = `${len} / ${maxLength} ký tự`;

    if (len > maxLength * 0.9) {
      counterEl.className = "char-counter limit";
    } else if (len > maxLength * 0.75) {
      counterEl.className = "char-counter warning";
    } else {
      counterEl.className = "char-counter";
    }
  });
}

// ==================== XỬ LÝ ĐĂNG KÝ LỊCH TUẦN ====================
async function handleRegister(e) {
  e.preventDefault();

  const regDate = document.getElementById("regDate").value;
  const regDayOfWeek = document.getElementById("regDayOfWeek").value.trim();
  
  // Lấy thời điểm từ dropdown hoặc ô tự nhập
  const timeSelect = document.getElementById("regTimeSelect");
  const timeCustom = document.getElementById("regTimeCustom");
  let regTime = "";
  if (timeSelect) {
    if (timeSelect.value === "custom") {
      regTime = timeCustom ? timeCustom.value.trim() : "";
    } else {
      regTime = (timeSelect.value || "").trim();
    }
  }

  const regContent = document.getElementById("regContent").value.trim();
  const regAttendees = document.getElementById("regAttendees").value.trim();
  const regLocation = document.getElementById("regLocation").value.trim();

  // Bắt buộc nhập đầy đủ tất cả các ô
  if (!regDate || !regDayOfWeek || !regTime || !regContent || !regAttendees || !regLocation) {
    showToast("Vui lòng chọn thời điểm và điền đầy đủ tất cả các ô thông tin!", "warning");
    return;
  }

  // Kiểm tra giới hạn 500 ký tự
  if (regContent.length > 500 || regAttendees.length > 500 || regLocation.length > 500) {
    showToast("Nội dung, thành phần hoặc địa điểm không được vượt quá 500 ký tự!", "danger");
    return;
  }

  // Định dạng ngày sang DD/MM/YYYY
  const parts = regDate.split("-");
  const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

  const submitBtn = document.getElementById("btnSubmitRegister");
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⏳ Đang gửi đăng ký...</span>";

  const newScheduleItem = {
    id: "LT-" + Date.now(),
    timestamp: formatCurrentTimestamp(),
    email: currentUser ? currentUser.email : "user@gmail.com",
    date: formattedDate,
    rawDate: regDate,
    dayOfWeek: regDayOfWeek,
    time: regTime,
    content: regContent,
    attendees: regAttendees,
    location: regLocation
  };

  try {
    // 1. Gửi lên Google Apps Script nếu có kết nối
    let syncedToGoogle = false;
    if (googleScriptUrl) {
      try {
        const response = await fetch(googleScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "register",
            email: newScheduleItem.email,
            date: newScheduleItem.date,
            dayOfWeek: newScheduleItem.dayOfWeek,
            time: newScheduleItem.time,
            content: newScheduleItem.content,
            attendees: newScheduleItem.attendees,
            location: newScheduleItem.location
          })
        });
        const result = await response.json();
        if (result.success) {
          syncedToGoogle = true;
        }
      } catch (err) {
        console.warn("Lỗi đồng bộ Google Sheets, lưu trữ cục bộ:", err);
      }
    }

    // 2. Lưu vào danh sách cục bộ để hiển thị ngay
    scheduleData.unshift(newScheduleItem);
    localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify(scheduleData));

    // Cập nhật lại giao diện bảng
    renderScheduleTable(scheduleData);

    // Reset các ô nhập liệu (giữ lại ngày để người dùng tiện đăng ký tiếp buổi khác)
    if (timeSelect) timeSelect.selectedIndex = 0;
    if (timeCustom) {
      timeCustom.value = "";
      timeCustom.style.display = "none";
    }
    document.getElementById("regContent").value = "";
    document.getElementById("regAttendees").value = "";
    document.getElementById("regLocation").value = "";
    document.getElementById("contentCounter").textContent = "0 / 500 ký tự";
    document.getElementById("attendeesCounter").textContent = "0 / 500 ký tự";
    document.getElementById("locationCounter").textContent = "0 / 500 ký tự";

    if (syncedToGoogle) {
      showToast("🎉 Đăng ký thành công và đã lưu vào Google Sheets!", "success");
    } else {
      showToast("🎉 Đăng ký thành công! (Đã lưu vào bộ nhớ web)", "success");
    }
  } catch (error) {
    showToast("Đã có lỗi xảy ra: " + error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-icon">➕</span> <span class="btn-text">Đăng Ký Lịch Này</span>';
  }
}

// ==================== TẢI VÀ HIỂN THỊ DANH SÁCH LỊCH ====================
async function loadScheduleList(forceRefresh = false) {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) return;

  if (forceRefresh) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center empty-state">⏳ Đang làm mới dữ liệu...</td></tr>`;
  }

  // Nếu có Google Apps Script URL, thử tải dữ liệu mới nhất
  if (googleScriptUrl) {
    try {
      const response = await fetch(`${googleScriptUrl}?action=getSchedule`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        scheduleData = result.data.map(item => ({
          ...item,
          rawDate: convertDDMMYYYYtoYYYYMMDD(item.date)
        }));
        localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify(scheduleData));
      }
    } catch (err) {
      console.warn("Không tải được từ Google Sheets, sử dụng cache cục bộ:", err);
    }
  }

  renderScheduleTable(scheduleData);
}

function renderScheduleTable(data) {
  const tbody = document.getElementById("scheduleTableBody");
  const countBadge = document.getElementById("totalScheduleCount");
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center empty-state">
          Chưa có mục đăng ký nào trong tuần. Hãy nhập thông tin ở bảng bên trái và bấm <strong>Đăng Ký Lịch Này</strong>!
        </td>
      </tr>`;
    if (countBadge) countBadge.textContent = "0 mục";
    return;
  }

  // Sắp xếp theo ngày tăng dần
  const sorted = [...data].sort((a, b) => {
    const da = a.rawDate || convertDDMMYYYYtoYYYYMMDD(a.date);
    const db = b.rawDate || convertDDMMYYYYtoYYYYMMDD(b.date);
    return da.localeCompare(db);
  });

  if (countBadge) countBadge.textContent = `${sorted.length} mục`;

  tbody.innerHTML = sorted.map((item, idx) => {
    return `
      <tr>
        <td>
          <span class="day-badge">${escapeHtml(item.dayOfWeek || "")}</span>
          <span class="date-text">${escapeHtml(item.date || "")}</span>
        </td>
        <td><strong>${escapeHtml(item.time || "")}</strong></td>
        <td>${escapeHtml(item.content || "")}</td>
        <td><small>${escapeHtml(item.attendees || "")}</small></td>
        <td><small>${escapeHtml(item.location || "")}</small></td>
        <td><span class="user-tag" title="${escapeHtml(item.email || "")}">${escapeHtml(item.email ? item.email.split("@")[0] : "")}</span></td>
      </tr>
    `;
  }).join("");
}

function filterScheduleTable(keyword) {
  const term = (keyword || "").toLowerCase().trim();
  if (!term) {
    renderScheduleTable(scheduleData);
    return;
  }

  const filtered = scheduleData.filter(item => {
    return (
      (item.content && item.content.toLowerCase().includes(term)) ||
      (item.attendees && item.attendees.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.dayOfWeek && item.dayOfWeek.toLowerCase().includes(term)) ||
      (item.date && item.date.toLowerCase().includes(term)) ||
      (item.email && item.email.toLowerCase().includes(term))
    );
  });

  renderScheduleTable(filtered);
}

// ==================== XUẤT LỊCH TUẦN WORD (.DOCX) CHUẨN NGHỊ ĐỊNH 30 ====================
async function exportWeeklyScheduleWord() {
  if (!scheduleData || scheduleData.length === 0) {
    showToast("Chưa có dữ liệu đăng ký nào để xuất file Word!", "warning");
    return;
  }

  const btnExport = document.getElementById("btnExportWord");
  btnExport.disabled = true;
  btnExport.innerHTML = "⏳ Đang tạo file Word...";

  try {
    // Sắp xếp dữ liệu theo ngày
    const sorted = [...scheduleData].sort((a, b) => {
      const da = a.rawDate || convertDDMMYYYYtoYYYYMMDD(a.date);
      const db = b.rawDate || convertDDMMYYYYtoYYYYMMDD(b.date);
      return da.localeCompare(db);
    });

    const firstDate = sorted[0].date || "";
    const lastDate = sorted[sorted.length - 1].date || "";
    const today = new Date();
    const curDay = String(today.getDate()).padStart(2, '0');
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    const curYear = today.getFullYear();

    // 1. Kiểm tra nếu thư viện docx đã được nạp
    if (window.docx) {
      await generateDocxWithLibrary(sorted, firstDate, lastDate, curDay, curMonth, curYear);
    } else {
      // 2. Chế độ Fallback: Xuất file Word XML chuẩn MSO tương thích 100% Word mọi phiên bản
      generateDocxXmlFallback(sorted, firstDate, lastDate, curDay, curMonth, curYear);
    }

    showToast("Đã xuất file Lịch tuần Word (.docx) chuẩn Nghị định 30 thành công!", "success");
  } catch (error) {
    console.error("Lỗi khi xuất Word:", error);
    // Nếu tạo thư viện bị lỗi thì dùng fallback
    generateDocxXmlFallback(scheduleData, "", "", "", "", "");
    showToast("Đã tải file Word Lịch tuần thành công!", "success");
  } finally {
    btnExport.disabled = false;
    btnExport.innerHTML = '<span class="btn-icon">📄</span> <strong>Xuất Lịch tuần Word</strong>';
  }
}

/**
 * Tạo file Word .docx dùng thư viện docx (Chuẩn toàn diện NĐ 30/2020)
 */
async function generateDocxWithLibrary(data, firstDate, lastDate, day, month, year) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    HeightRule
  } = window.docx;

  // Đường viền bảng
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
  };

  const noBorders = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE }
  };

  // Header Table (2 cột: Trái - Đơn vị, Phải - Quốc hiệu)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Cột trái: Tên cơ quan
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG", size: 24, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI", bold: true, size: 25, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "CHI NHÁNH SỐ 23", bold: true, size: 25, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "————————", bold: true, size: 17, font: "Times New Roman" })
                ]
              })
            ]
          }),
          // Cột phải: Quốc hiệu & Tiêu ngữ
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 25, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 26, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "——————————————————", bold: true, size: 17, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Thủ Dầu Một, ngày ${day} tháng ${month} năm ${year}`, italics: true, size: 26, font: "Times New Roman" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // Hàng tiêu đề bảng Lịch công tác
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "STT", bold: true, size: 24, font: "Times New Roman" })] })]
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Thứ / Ngày", bold: true, size: 24, font: "Times New Roman" })] })]
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Thời gian", bold: true, size: 24, font: "Times New Roman" })] })]
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nội dung công tác", bold: true, size: 24, font: "Times New Roman" })] })]
      }),
      new TableCell({
        width: { size: 18, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Thành phần", bold: true, size: 24, font: "Times New Roman" })] })]
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Địa điểm", bold: true, size: 24, font: "Times New Roman" })] })]
      })
    ]
  });

  // Hàng dữ liệu
  const tableDataRows = data.map((item, index) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(index + 1), size: 24, font: "Times New Roman" })] })]
        }),
        new TableCell({
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.dayOfWeek || "", bold: true, size: 24, font: "Times New Roman" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.date || "", size: 22, font: "Times New Roman" })] })
          ]
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.time || "", bold: true, size: 24, font: "Times New Roman" })] })]
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: item.content || "", size: 24, font: "Times New Roman" })] })]
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: item.attendees || "", size: 24, font: "Times New Roman" })] })]
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: item.location || "", size: 24, font: "Times New Roman" })] })]
        })
      ]
    });
  });

  const mainScheduleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [tableHeaderRow, ...tableDataRows]
  });

  // Bảng Ký duyệt cuối văn bản
  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Nơi nhận:", bold: true, italics: true, size: 24, font: "Times New Roman" })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "- Ban Giám đốc VPĐK;", size: 22, font: "Times New Roman" })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "- Các Tổ chuyên môn;", size: 22, font: "Times New Roman" })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "- Lưu: VT, TH.", size: 22, font: "Times New Roman" })]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "KT. GIÁM ĐỐC", bold: true, size: 26, font: "Times New Roman" })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "PHÓ GIÁM ĐỐC", bold: true, size: 26, font: "Times New Roman" })]
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Nguyễn Thị Lệ Hằng", bold: true, size: 26, font: "Times New Roman" })]
              })
            ]
          })
        ]
      })
    ]
  });

  // Tạo toàn bộ văn bản docx
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,    // 20mm
              bottom: 1134, // 20mm
              left: 1701,   // 30mm
              right: 850    // 15mm
            }
          }
        },
        children: [
          headerTable,
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "LỊCH CÔNG TÁC TUẦN", bold: true, size: 30, font: "Times New Roman" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `(Từ ngày ${firstDate} đến ngày ${lastDate})`, italics: true, size: 26, font: "Times New Roman" })
            ]
          }),
          new Paragraph({ text: "" }),
          mainScheduleTable,
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          signTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Lich_Tuan_VPDK_${firstDate.replace(/\//g, "-")}_den_${lastDate.replace(/\//g, "-")}.docx`;
  
  if (window.saveAs) {
    window.saveAs(blob, fileName);
  } else {
    downloadBlob(blob, fileName);
  }
}

/**
 * Fallback tạo file Word chất lượng cao tương thích 100% Microsoft Word
 */
function generateDocxXmlFallback(data, firstDate, lastDate, day, month, year) {
  const fDate = firstDate || (data[0] ? data[0].date : "");
  const lDate = lastDate || (data[data.length - 1] ? data[data.length - 1].date : "");
  const d = day || new Date().getDate();
  const m = month || (new Date().getMonth() + 1);
  const y = year || new Date().getFullYear();

  let rowsHtml = data.map((item, index) => {
    return `
      <tr>
        <td style="text-align: center; font-size: 13pt; padding: 6px; border: 1px solid #000;">${index + 1}</td>
        <td style="text-align: center; font-size: 13pt; padding: 6px; border: 1px solid #000;">
          <strong>${item.dayOfWeek || ""}</strong><br/>
          <span>${item.date || ""}</span>
        </td>
        <td style="text-align: center; font-size: 13pt; font-weight: bold; padding: 6px; border: 1px solid #000;">${item.time || ""}</td>
        <td style="font-size: 13pt; padding: 6px; border: 1px solid #000;">${item.content || ""}</td>
        <td style="font-size: 13pt; padding: 6px; border: 1px solid #000;">${item.attendees || ""}</td>
        <td style="font-size: 13pt; padding: 6px; border: 1px solid #000;">${item.location || ""}</td>
      </tr>
    `;
  }).join("");

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Lịch Công Tác Tuần</title>
      <style>
        @page {
          size: 210mm 297mm;
          margin: 20mm 15mm 20mm 30mm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.25;
          color: #000;
        }
        table { border-collapse: collapse; width: 100%; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
      </style>
    </head>
    <body>
      <!-- Header Table -->
      <table style="width: 100%; border: none; margin-bottom: 20px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none;">
            <div style="font-size: 12pt;">SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG</div>
            <div style="font-size: 12.5pt; font-weight: bold;">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</div>
            <div style="font-size: 13pt; font-weight: bold;">CHI NHÁNH SỐ 23</div>
            <div style="font-size: 8.5pt; font-weight: bold;">————————</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none;">
            <div style="font-size: 12.5pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 13pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-size: 8.5pt; font-weight: bold;">——————————————————</div>
            <div style="font-size: 13pt; font-style: italic; margin-top: 4px;">Thủ Dầu Một, ngày ${d} tháng ${m} năm ${y}</div>
          </td>
        </tr>
      </table>

      <!-- Tiêu đề -->
      <div style="text-align: center; margin: 15px 0 5px 0;">
        <span style="font-size: 15pt; font-weight: bold;">LỊCH CÔNG TÁC TUẦN</span>
      </div>
      <div style="text-align: center; font-style: italic; font-size: 13pt; margin-bottom: 18px;">
        (Từ ngày ${fDate} đến ngày ${lDate})
      </div>

      <!-- Bảng lịch công tác -->
      <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 5%; border: 1px solid #000; padding: 6px; font-size: 13pt; text-align: center;">STT</th>
            <th style="width: 15%; border: 1px solid #000; padding: 6px; font-size: 13pt; text-align: center;">Thứ / Ngày</th>
            <th style="width: 12%; border: 1px solid #000; padding: 6px; font-size: 13pt; text-align: center;">Thời gian</th>
            <th style="width: 32%; border: 1px solid #000; padding: 6px; font-size: 13pt; text-align: center;">Nội dung công tác</th>
            <th style="width: 18%; border: 1px solid #000; padding: 6px; font-size: 13pt; text-align: center;">Thành phần</th>
            <th style="width: 18%; border: 1px solid #000; padding: 6px; font-size: 13pt; text-align: center;">Địa điểm</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Ký duyệt cuối trang -->
      <table style="width: 100%; border: none; margin-top: 30px;">
        <tr>
          <td style="width: 50%; vertical-align: top; border: none;">
            <div style="font-weight: bold; font-style: italic; font-size: 12pt;">Nơi nhận:</div>
            <div style="font-size: 11pt;">- Ban Giám đốc VPĐK;</div>
            <div style="font-size: 11pt;">- Các Tổ chuyên môn;</div>
            <div style="font-size: 11pt;">- Lưu: VT, TH.</div>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
            <div style="font-weight: bold; font-size: 13pt;">KT. GIÁM ĐỐC</div>
            <div style="font-weight: bold; font-size: 13pt;">PHÓ GIÁM ĐỐC</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold; font-size: 13pt;">Nguyễn Thị Lệ Hằng</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
  const fileName = `Lich_Tuan_VPDK_${fDate.replace(/\//g, "-")}_den_${lDate.replace(/\//g, "-")}.doc`;
  downloadBlob(blob, fileName);
}

function downloadBlob(blob, fileName) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// ==================== CẤU HÌNH GOOGLE APPS SCRIPT URL ====================
function saveGoogleScriptConfig() {
  const url = document.getElementById("googleScriptUrlInput").value.trim();
  if (url && !url.startsWith("https://script.google.com/macros/s/")) {
    showToast("URL Google Apps Script chưa đúng định dạng!", "warning");
    return;
  }

  googleScriptUrl = url;
  localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, url);

  document.getElementById("configModal").style.display = "none";
  showToast("Đã lưu URL Google Apps Script thành công!", "success");

  if (url) {
    loadScheduleList(true);
  }
}

async function testGoogleScriptConnection() {
  const url = document.getElementById("googleScriptUrlInput").value.trim();
  if (!url) {
    showToast("Vui lòng nhập đường link Google Apps Script trước!", "warning");
    return;
  }

  updateConnectionStatusUI(false, "Đang kết nối...");
  try {
    const response = await fetch(`${url}?action=getSchedule`);
    const result = await response.json();
    if (result.success !== undefined) {
      updateConnectionStatusUI(true, "Kết nối Google Sheets thành công!");
      showToast("Kết nối Google Sheets thành công!", "success");
    } else {
      updateConnectionStatusUI(false, "Không thể kết nối đến Google Sheets");
    }
  } catch (error) {
    updateConnectionStatusUI(false, "Lỗi kết nối: " + error.message);
  }
}

function updateConnectionStatusUI(isConnected, text) {
  const dot = document.getElementById("statusDot");
  const textEl = document.getElementById("statusText");
  if (!dot || !textEl) return;

  dot.className = isConnected ? "status-indicator connected" : "status-indicator error";
  textEl.textContent = text;
}

// ==================== TIỆN ÍCH HỖ TRỢ ====================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease-in";
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, 3500);
}

function formatCurrentTimestamp() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${mi}:${s}`;
}

function convertDDMMYYYYtoYYYYMMDD(ddmmyyyy) {
  if (!ddmmyyyy) return "";
  const parts = ddmmyyyy.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ddmmyyyy;
}

function escapeHtml(string) {
  if (!string) return "";
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}
