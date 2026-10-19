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

// Dữ liệu ban đầu rỗng, chỉ chạy dữ liệu thật
const INITIAL_DEMO_SCHEDULE = [];

// Đường link Google Apps Script chính thức mặc định của hệ thống
const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLjARkYWp2TegCCdMcfVc3W6qQm6PmhFz71-y8zB_xFXxXbRXpsUhk6aPbJtqVqUHE/exec";

// Trạng thái ứng dụng
let currentUser = null;
let scheduleData = [];
let googleScriptUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || DEFAULT_SCRIPT_URL;

// Email Quản trị viên duy nhất được phép xem và cấu hình Server API
const ADMIN_EMAIL = "quan.vpdk@gmail.com";

// Danh mục định danh người dùng: Hiển thị Họ và tên đầy đủ thay vì email thô
const KNOWN_USERS_MAP = {
  "quan.vpdk@gmail.com": "Đỗ Trọng Minh Quân",
  "tuyen.vpdk@gmail.com": "Nguyễn Thị Kim Tuyền",
  "thang.vpdk@gmail.com": "Nguyễn Chiến Thắng",
  "nhanvien@gmail.com": "Nguyễn Văn An"
};

/**
 * Lấy họ và tên đầy đủ của người gửi
 */
function getSenderDisplayName(item) {
  if (!item) return "Người dùng";
  const emailLower = (item.email || "").toLowerCase().trim();
  if (KNOWN_USERS_MAP[emailLower]) {
    return KNOWN_USERS_MAP[emailLower];
  }
  if (item.name && item.name.trim() && !item.name.includes("@") && item.name !== "Người dùng" && item.name !== "Nhân viên") {
    return item.name.trim();
  }
  if (emailLower) {
    const prefix = emailLower.split("@")[0];
    return prefix.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  }
  return item.name || "Người dùng";
}

/**
 * Kiểm tra trạng thái cuộc họp real-time (Sắp diễn ra, Đang diễn ra, Đã diễn ra)
 * Hỗ trợ bôi xám / làm mờ cuộc họp đã qua
 */
function getMeetingStatus(dateVal, timeVal) {
  try {
    const cleanDate = formatDisplayDate(dateVal); // dạng DD/MM/YYYY
    const cleanTime = formatDisplayTime(timeVal); // dạng HH:mm
    if (!cleanDate) {
      return { status: "unknown", label: "Lịch tuần", badgeClass: "status-upcoming", isPast: false };
    }

    const dateParts = cleanDate.split("/");
    if (dateParts.length !== 3) {
      return { status: "unknown", label: "Lịch tuần", badgeClass: "status-upcoming", isPast: false };
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);

    let hour = 8;
    let minute = 0;
    if (cleanTime && cleanTime.includes(":")) {
      const timeParts = cleanTime.split(":");
      hour = parseInt(timeParts[0], 10) || 0;
      minute = parseInt(timeParts[1], 10) || 0;
    }

    const startTime = new Date(year, month, day, hour, minute, 0).getTime();
    // Cuộc họp mặc định kéo dài trong 2 giờ
    const endTime = startTime + (2 * 60 * 60 * 1000);
    const now = Date.now();

    if (now > endTime) {
      return {
        status: "past",
        label: "Đã diễn ra",
        badgeClass: "status-past",
        isPast: true
      };
    } else if (now >= startTime && now <= endTime) {
      return {
        status: "ongoing",
        label: "Đang diễn ra",
        badgeClass: "status-ongoing",
        isPast: false
      };
    } else {
      return {
        status: "upcoming",
        label: "Sắp diễn ra",
        badgeClass: "status-upcoming",
        isPast: false
      };
    }
  } catch (err) {
    return { status: "unknown", label: "Lịch tuần", badgeClass: "status-upcoming", isPast: false };
  }
}

// ==================== KHỞI CHẠY ỨNG DỤNG ====================
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  bindEvents();
  checkAutoLogin();
  updateSyncBanner();

  // Kiểm tra thời gian thực (real-time) mỗi 60 giây để cập nhật trạng thái cuộc họp
  setInterval(() => {
    if (scheduleData && scheduleData.length > 0) {
      renderScheduleTable(currentFilteredList.length > 0 ? currentFilteredList : scheduleData);
    }
  }, 60000);
});

function initStorage() {
  const existingSchedule = localStorage.getItem(STORAGE_KEYS.LOCAL_SCHEDULE);
  if (!existingSchedule) {
    scheduleData = [];
    localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify([]));
  } else {
    try {
      const parsed = JSON.parse(existingSchedule);
      // Xoá bỏ sạch các dữ liệu mẫu cũ (LT-001, LT-002, LT-003) nếu còn lưu trong máy
      scheduleData = Array.isArray(parsed) 
        ? parsed.filter(item => !["LT-001", "LT-002", "LT-003"].includes(item.id))
        : [];
      localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify(scheduleData));
    } catch (e) {
      scheduleData = [];
    }
  }

  // Điền URL cấu hình nếu có
  const inputUrl = document.getElementById("googleScriptUrlInput");
  if (inputUrl && googleScriptUrl) {
    inputUrl.value = googleScriptUrl;
    updateConnectionStatusUI(true, "Đã kết nối Google Apps Script chính thức");
  }

  updateSyncBanner();

  // Điền sẵn ngày hôm nay vào ô chọn ngày và CHẶN CHỌN NGÀY TRONG QUÁ KHỨ
  const regDateInput = document.getElementById("regDate");
  if (regDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    // Thuộc tính min ngăn chặn việc chọn bất kỳ ngày nào trong quá khứ trên lịch
    regDateInput.min = todayStr;
    if (!regDateInput.value || regDateInput.value < todayStr) {
      regDateInput.value = todayStr;
    }
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

  // Modal Cấu hình Server (Chỉ Quản trị viên Đỗ Trọng Minh Quân được phép mở)
  const btnAdminServerConfig = document.getElementById("btnAdminServerConfig");
  const btnBannerConfig = document.getElementById("btnBannerConfig");
  const configModal = document.getElementById("configModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnSaveConfig = document.getElementById("btnSaveConfig");
  const btnTestConnection = document.getElementById("btnTestConnection");

  const openConfig = () => {
    if (!currentUser || currentUser.email.toLowerCase().trim() !== ADMIN_EMAIL) {
      showToast("Chức năng Cấu hình Server chỉ dành riêng cho Quản trị viên (Đỗ Trọng Minh Quân)!", "error");
      return;
    }
    if (configModal) configModal.style.display = "flex";
  };

  if (btnAdminServerConfig) btnAdminServerConfig.addEventListener("click", openConfig);
  if (btnBannerConfig) btnBannerConfig.addEventListener("click", openConfig);

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

  // Modal Xem Chi Tiết Lịch Công Tác (Xử lý overtext/overflow 500 ký tự)
  const detailModal = document.getElementById("scheduleDetailModal");
  const btnCloseDetailModal = document.getElementById("btnCloseDetailModal");
  const btnCloseDetailBtn = document.getElementById("btnCloseDetailBtn");

  const closeDetail = () => {
    if (detailModal) detailModal.style.display = "none";
  };

  if (btnCloseDetailModal) btnCloseDetailModal.addEventListener("click", closeDetail);
  if (btnCloseDetailBtn) btnCloseDetailBtn.addEventListener("click", closeDetail);
  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) closeDetail();
    });
  }

  // Modal Quên Mật Khẩu (Liên hệ Quản trị viên Đỗ Trọng Minh Quân qua Zalo 0973807027)
  const btnForgotPassword = document.getElementById("btnForgotPassword");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const btnCloseForgotModal = document.getElementById("btnCloseForgotModal");
  const btnCloseForgotBtn = document.getElementById("btnCloseForgotBtn");

  const closeForgotModal = () => {
    if (forgotPasswordModal) forgotPasswordModal.style.display = "none";
  };

  if (btnForgotPassword) {
    btnForgotPassword.addEventListener("click", () => {
      if (forgotPasswordModal) {
        forgotPasswordModal.style.display = "flex";
      } else {
        alert("Vui lòng liên hệ Quản trị viên Đỗ Trọng Minh Quân qua Zalo/SĐT: 0973.807.027 để được cấp lại mật khẩu!");
      }
    });
  }

  if (btnCloseForgotModal) btnCloseForgotModal.addEventListener("click", closeForgotModal);
  if (btnCloseForgotBtn) btnCloseForgotBtn.addEventListener("click", closeForgotModal);
  if (forgotPasswordModal) {
    forgotPasswordModal.addEventListener("click", (e) => {
      if (e.target === forgotPasswordModal) closeForgotModal();
    });
  }
}

function updateSyncBanner() {
  const banner = document.getElementById("syncWarningBanner");
  if (!banner) return;
  // Chỉ hiển thị banner nếu chưa có link Google Script và đã vào màn hình chính
  if (!googleScriptUrl) {
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
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
          const userObj = result.user || {};
          if (KNOWN_USERS_MAP[emailInput]) {
            userObj.name = KNOWN_USERS_MAP[emailInput];
          }
          if (emailInput === ADMIN_EMAIL) {
            userObj.role = "admin";
          }
          onLoginSuccess(userObj, rememberMe);
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
      if (emailInput === ADMIN_EMAIL) {
        role = "admin";
        name = "Đỗ Trọng Minh Quân";
      } else if (emailInput.includes("tuyen") || emailInput.includes("admin")) {
        role = "admin";
        name = "Nguyễn Thị Kim Tuyền";
      } else if (emailInput.includes("thang")) {
        role = "user";
        name = "Nguyễn Chiến Thắng";
      } else if (KNOWN_USERS_MAP[emailInput]) {
        name = KNOWN_USERS_MAP[emailInput];
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

  showToast(`Xin chào ${getSenderDisplayName(user)}! Đăng nhập thành công.`, "success");
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

  const btnAdminConfig = document.getElementById("btnAdminServerConfig");
  if (btnAdminConfig) btnAdminConfig.style.display = "none";

  showToast("Bạn đã đăng xuất khỏi hệ thống.", "info");
}

function showWorkspaceUI() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("appWorkspace").style.display = "grid";
  document.getElementById("headerUserArea").style.display = "flex";

  const displayName = getSenderDisplayName(currentUser);
  document.getElementById("displayUserName").textContent = displayName;
  document.getElementById("displayUserEmail").textContent = currentUser.email;

  // Hiển thị nút Cấu hình Server DUY NHẤT cho Quản trị viên (quan.vpdk@gmail.com)
  const isAdmin = currentUser && currentUser.email.toLowerCase().trim() === ADMIN_EMAIL;
  const btnAdminConfig = document.getElementById("btnAdminServerConfig");
  if (btnAdminConfig) {
    btnAdminConfig.style.display = isAdmin ? "inline-flex" : "none";
  }

  updateSyncBanner();
}

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

  const submitBtn = document.getElementById("btnSubmitRegister");
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

  // Chặn chọn ngày trong quá khứ
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  if (regDate < todayStr) {
    showToast("Không thể đăng ký lịch trong quá khứ! Vui lòng chọn ngày từ hôm nay trở đi.", "warning");
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

  // Tạo đối tượng lịch đăng ký hoàn chỉnh
  const newScheduleItem = {
    id: "LT-" + Date.now(),
    date: formattedDate,
    rawDate: regDate,
    dayOfWeek: regDayOfWeek,
    time: regTime,
    content: regContent,
    attendees: regAttendees,
    location: regLocation,
    email: currentUser ? currentUser.email : "user@gmail.com",
    name: getSenderDisplayName(currentUser),
    created_at: new Date().toISOString()
  };

  // Trạng thái nút bấm đang lưu
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="btn-svg spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
      <span class="btn-text">Đang nạp dữ liệu lên server...</span>
    `;
  }

  try {
    // 1. Gửi lên máy chủ API (POST trước, nếu bị lỗi mạng/CORS thì tự động kích hoạt GET fallback)
    let syncedToGoogle = false;
    let syncErrorMsg = null;

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
        if (result && result.success) {
          syncedToGoogle = true;
        } else if (result && result.message) {
          syncErrorMsg = result.message;
        }
      } catch (errPost) {
        console.warn("POST server không phản hồi, đang kích hoạt GET fallback:", errPost);
        // Fallback sang GET query parameters (Tuyệt đối không bị lỗi CORS trên bất kỳ trình duyệt nào)
        try {
          const qParams = new URLSearchParams({
            action: "register",
            email: newScheduleItem.email,
            date: newScheduleItem.date,
            dayOfWeek: newScheduleItem.dayOfWeek,
            time: newScheduleItem.time,
            content: newScheduleItem.content,
            attendees: newScheduleItem.attendees,
            location: newScheduleItem.location
          });
          const getUrl = googleScriptUrl.includes("?") 
            ? `${googleScriptUrl}&${qParams.toString()}` 
            : `${googleScriptUrl}?${qParams.toString()}`;
          const resGet = await fetch(getUrl);
          const resGetJson = await resGet.json();
          if (resGetJson && resGetJson.success) {
            syncedToGoogle = true;
          } else if (resGetJson && resGetJson.message) {
            syncErrorMsg = resGetJson.message;
          }
        } catch (errGet) {
          console.error("GET fallback server cũng thất bại:", errGet);
          syncErrorMsg = errGet.message;
        }
      }
    }

    // 2. Lưu vào danh sách cục bộ để hiển thị ngay lập tức trên web
    scheduleData.unshift(newScheduleItem);
    localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify(scheduleData));

    // Cập nhật lại giao diện bảng (tự động sort mới nhất lên đầu)
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
      showToast("🎉 Đã nạp dữ liệu lên server thành công!", "success");
      // Tải lại nhẹ nhàng sau 1s để đồng bộ ID chuẩn
      setTimeout(() => loadScheduleList(false), 1000);
    } else if (googleScriptUrl) {
      showToast(`⚠️ Dữ liệu đã lưu tạm trên máy nhưng chưa gửi lên server: ${syncErrorMsg || "Lỗi mạng"}.`, "warning");
    } else {
      showToast("Đã lưu vào danh sách cục bộ.", "info");
    }
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    showToast("Đã có lỗi xảy ra: " + error.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg class="btn-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        <span class="btn-text">Đăng Ký Lịch Này</span>
      `;
    }
  }
}

// ==================== TẢI VÀ HIỂN THỊ DANH SÁCH LỊCH ====================
let currentPage = 1;
const PAGE_SIZE = 7; // Hiển thị 7 lịch trên 1 trang để vừa vặn màn hình không phải cuộn nhiều
let currentFilteredList = [];

// Hàm so sánh sắp xếp: MỚI NHẤT TỚI CŨ NHẤT (dành cho bảng hiển thị trên web)
function compareScheduleNewestFirst(a, b) {
  const da = a.rawDate || convertDDMMYYYYtoYYYYMMDD(a.date);
  const db = b.rawDate || convertDDMMYYYYtoYYYYMMDD(b.date);
  if (da !== db) {
    return db.localeCompare(da); // Ngày mới nhất lên trước
  }
  const ta = (a.time || "").trim();
  const tb = (b.time || "").trim();
  if (ta !== tb) {
    return tb.localeCompare(ta); // Giờ muộn hơn lên trước trong cùng ngày
  }
  return (b.id || "").localeCompare(a.id || "");
}

// Hàm so sánh sắp xếp: THEO TRÌNH TỰ THỜI GIAN TUẦN (Thứ Hai -> Chủ Nhật, sáng -> chiều, dùng cho xuất Word)
function compareScheduleChronological(a, b) {
  const da = a.rawDate || convertDDMMYYYYtoYYYYMMDD(a.date);
  const db = b.rawDate || convertDDMMYYYYtoYYYYMMDD(b.date);
  if (da !== db) {
    return da.localeCompare(db); // Ngày từ đầu tuần đến cuối tuần
  }
  const ta = (a.time || "").trim();
  const tb = (b.time || "").trim();
  return ta.localeCompare(tb); // Giờ từ sáng đến chiều
}

async function loadScheduleList(forceRefresh = false) {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) return;

  if (forceRefresh) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center empty-state">⏳ Đang tải dữ liệu từ server về...</td></tr>`;
  }

  // Nếu có máy chủ API, nạp dữ liệu mới nhất
  if (googleScriptUrl) {
    try {
      const response = await fetch(`${googleScriptUrl}?action=getSchedule`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        scheduleData = result.data.map(item => {
          const cleanDate = formatDisplayDate(item.date);
          const cleanTime = formatDisplayTime(item.time);
          const senderName = getSenderDisplayName(item);
          return {
            ...item,
            name: senderName,
            date: cleanDate,
            time: cleanTime,
            rawDate: convertDDMMYYYYtoYYYYMMDD(cleanDate)
          };
        });
        localStorage.setItem(STORAGE_KEYS.LOCAL_SCHEDULE, JSON.stringify(scheduleData));
      }
    } catch (err) {
      console.warn("Không tải được từ server, sử dụng cache cục bộ:", err);
    }
  }

  renderScheduleTable(scheduleData);
}

function renderScheduleTable(data) {
  const tbody = document.getElementById("scheduleTableBody");
  const countBadge = document.getElementById("totalScheduleCount");
  const paginationBar = document.getElementById("paginationBar");
  if (!tbody) return;

  currentFilteredList = Array.isArray(data) ? data : [];

  if (!currentFilteredList || currentFilteredList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center empty-state">
          Chưa có mục đăng ký nào trong tuần. Hãy nhập thông tin ở bảng bên trái và bấm <strong>Đăng Ký Lịch Này</strong>!
        </td>
      </tr>`;
    if (countBadge) countBadge.textContent = "0 mục";
    if (paginationBar) paginationBar.style.display = "none";
    return;
  }

  // SẮP XẾP THỜI ĐIỂM: MỚI NHẤT TỚI CŨ NHẤT THEO YÊU CẦU
  const sorted = [...currentFilteredList].sort(compareScheduleNewestFirst);

  const totalItems = sorted.length;
  if (countBadge) countBadge.textContent = `${totalItems} mục`;

  // XỬ LÝ PHÂN TRANG (PAGINATION)
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const pageItems = sorted.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map((item) => {
    const displayDate = formatDisplayDate(item.date);
    const displayTime = formatDisplayTime(item.time);
    const senderName = getSenderDisplayName(item);
    const status = getMeetingStatus(item.date, item.time);

    // Xử lý overflow text dài 500 ký tự (rút gọn hiển thị dấu ba chấm và có nút bấm mở pop-up)
    const contentHtml = formatCellTextWithTruncate(item.content, item.id, "Nội dung");
    const attendeesHtml = formatCellTextWithTruncate(item.attendees, item.id, "Thành phần");
    const locationHtml = formatCellTextWithTruncate(item.location, item.id, "Địa điểm");

    return `
      <tr class="schedule-row-clickable ${status.isPast ? 'row-meeting-past' : ''}" onclick="openScheduleDetailModal('${item.id}')" title="Bấm vào hàng này để xem đầy đủ chi tiết lịch công tác">
        <td data-label="Thứ / Ngày">
          <span class="day-badge">${escapeHtml(item.dayOfWeek || "")}</span>
          <span class="date-text">${escapeHtml(displayDate)}</span>
        </td>
        <td data-label="Thời điểm">
          <div class="time-status-container">
            <strong class="meeting-time-value">${escapeHtml(displayTime)}</strong>
            <span class="status-pill ${status.badgeClass}">${status.label}</span>
          </div>
        </td>
        <td data-label="Nội dung">${contentHtml}</td>
        <td data-label="Thành phần">${attendeesHtml}</td>
        <td data-label="Địa điểm">${locationHtml}</td>
        <td data-label="Người gửi">
          <span class="user-tag" title="${escapeHtml(item.email || "")}">
            ${escapeHtml(senderName)}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  // Cập nhật thanh phân trang
  renderPaginationControls(totalItems, totalPages, startIndex, endIndex);
}

// Xử lý chuỗi văn bản dài để tránh vỡ giao diện (overflow/overtext)
function formatCellTextWithTruncate(text, id, fieldName) {
  if (!text) return "";
  const clean = String(text).trim();
  const isLong = clean.length > 70 || clean.includes("\n");

  if (!isLong) {
    return `<div class="cell-text-normal">${escapeHtml(clean)}</div>`;
  }

  return `
    <div class="cell-content-box">
      <div class="cell-text-truncated" title="${escapeHtml(clean)}">${escapeHtml(clean)}</div>
      <button type="button" class="btn-detail-link" onclick="openScheduleDetailModal('${id}'); event.stopPropagation();" title="Bấm xem toàn bộ ${fieldName}">
        Xem thêm &raquo;
      </button>
    </div>
  `;
}

// Điều khiển nút phân trang
function renderPaginationControls(totalItems, totalPages, startIndex, endIndex) {
  const paginationBar = document.getElementById("paginationBar");
  const paginationInfo = document.getElementById("paginationInfo");
  const paginationControls = document.getElementById("paginationControls");
  if (!paginationBar || !paginationInfo || !paginationControls) return;

  if (totalItems <= PAGE_SIZE) {
    paginationBar.style.display = "flex";
    paginationInfo.innerHTML = `Hiển thị tất cả <strong>${totalItems}</strong> lịch đăng ký`;
    paginationControls.innerHTML = "";
    return;
  }

  paginationBar.style.display = "flex";
  paginationInfo.innerHTML = `Hiển thị <strong>${startIndex + 1} - ${endIndex}</strong> trên tổng số <strong>${totalItems}</strong> lịch`;

  let buttonsHtml = "";
  // Nút Trước
  buttonsHtml += `
    <button type="button" class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})" title="Trang trước">
      &laquo; Trước
    </button>
  `;

  // Các nút số trang
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      buttonsHtml += `
        <button type="button" class="page-btn ${p === currentPage ? 'active' : ''}" onclick="changePage(${p})">
          ${p}
        </button>
      `;
    } else if (p === currentPage - 2 || p === currentPage + 2) {
      buttonsHtml += `<span style="padding: 0 4px; color: #94a3b8; font-weight: bold;">...</span>`;
    }
  }

  // Nút Sau
  buttonsHtml += `
    <button type="button" class="page-btn ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})" title="Trang sau">
      Sau &raquo;
    </button>
  `;

  paginationControls.innerHTML = buttonsHtml;
}

// Chuyển trang
window.changePage = function(pageNumber) {
  currentPage = pageNumber;
  renderScheduleTable(currentFilteredList);
  // Cuộn nhẹ lên đầu bảng trên thiết bị di động
  const tableCard = document.querySelector(".table-card");
  if (tableCard && window.innerWidth <= 768) {
    tableCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Mở Pop-up xem chi tiết toàn bộ nội dung (hỗ trợ tới 500 ký tự)
window.openScheduleDetailModal = function(id) {
  const item = scheduleData.find(s => String(s.id) === String(id));
  if (!item) return;

  const modal = document.getElementById("scheduleDetailModal");
  if (!modal) return;

  const senderName = getSenderDisplayName(item);
  const status = getMeetingStatus(item.date, item.time);

  document.getElementById("detailDayBadge").textContent = item.dayOfWeek || "Lịch làm việc";
  document.getElementById("detailDateText").textContent = formatDisplayDate(item.date);
  document.getElementById("detailTimeText").innerHTML = `
    <span>${escapeHtml(formatDisplayTime(item.time))}</span>
    <span class="status-pill ${status.badgeClass}" style="margin-left: 8px; font-size: 0.78rem;">${status.label}</span>
  `;

  const registrant = item.email ? `${senderName} (${item.email})` : senderName;
  document.getElementById("detailUserText").textContent = registrant || "Cán bộ đăng ký";

  document.getElementById("detailContentText").textContent = item.content || "Không có nội dung";
  document.getElementById("detailAttendeesText").textContent = item.attendees || "Không có thành phần";
  document.getElementById("detailLocationText").textContent = item.location || "Không có địa điểm";

  modal.style.display = "flex";
};

function filterScheduleTable(keyword) {
  const term = (keyword || "").toLowerCase().trim();
  currentPage = 1; // Luôn đưa về trang đầu khi tìm kiếm
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
    // Sắp xếp dữ liệu theo trình tự thời gian tuần (Thứ Hai -> Chủ Nhật, sáng -> chiều) theo quy chuẩn hành chính
    const sorted = [...scheduleData].sort(compareScheduleChronological);

    const firstDate = sorted.length > 0 ? formatDisplayDate(sorted[0].date) : "";
    const lastDate = sorted.length > 0 ? formatDisplayDate(sorted[sorted.length - 1].date) : "";
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
    btnExport.innerHTML = `
      <svg class="btn-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <span><strong>Xuất Lịch tuần Word</strong></span>
    `;
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

  // Header Table (2 cột: Trái 38% - Đơn vị, Phải 62% - Quốc hiệu & Tiêu ngữ chuẩn NĐ 30 không rớt dòng chữ Việt Nam)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3550, 5805],
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Cột trái: Tên cơ quan (Không có Sở TNMT theo file mẫu)
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 10, right: 10 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI", size: 24, font: "Times New Roman" }),
                  new TextRun({ text: " THÀNH PHỐ HỒ CHÍ MINH", size: 24, font: "Times New Roman" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "CHI NHÁNH SỐ 23", bold: true, size: 24, font: "Times New Roman" })
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
          // Cột phải: Quốc hiệu & Tiêu ngữ (Rộng 62%, Cỡ chữ 12pt = size 24 chuẩn NĐ30 tuyệt đối không rớt dòng chữ Việt Nam)
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 10, right: 10 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 24, font: "Times New Roman" })
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
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatDisplayDate(item.date), size: 22, font: "Times New Roman" })] })
          ]
        }),
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatDisplayTime(item.time), bold: true, size: 24, font: "Times New Roman" })] })]
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

  // Bảng Ký duyệt cuối văn bản (Giám đốc Nguyễn Chiến Thắng)
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
                children: [new TextRun({ text: "GIÁM ĐỐC", bold: true, size: 26, font: "Times New Roman" })]
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Nguyễn Chiến Thắng", bold: true, size: 26, font: "Times New Roman" })]
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
          <span>${formatDisplayDate(item.date)}</span>
        </td>
        <td style="text-align: center; font-size: 13pt; font-weight: bold; padding: 6px; border: 1px solid #000;">${formatDisplayTime(item.time)}</td>
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
          <td style="width: 38%; text-align: center; vertical-align: top; border: none; padding: 0 4px;">
            <div style="font-size: 12pt; line-height: 1.25;">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI THÀNH PHỐ HỒ CHÍ MINH</div>
            <div style="font-size: 12pt; font-weight: bold; line-height: 1.25;">CHI NHÁNH SỐ 23</div>
            <div style="font-size: 8.5pt; font-weight: bold; margin-top: -2px;">————————</div>
          </td>
          <td style="width: 62%; text-align: center; vertical-align: top; border: none; padding: 0 4px;">
            <div style="font-size: 12pt; font-weight: bold; white-space: nowrap; line-height: 1.25;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 13pt; font-weight: bold; white-space: nowrap; line-height: 1.25;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-size: 8.5pt; font-weight: bold; margin-top: -2px;">——————————————————</div>
            <div style="font-size: 13pt; font-style: italic; margin-top: 4px; line-height: 1.25;">Thủ Dầu Một, ngày ${d} tháng ${m} năm ${y}</div>
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
            <div style="font-weight: bold; font-size: 13pt;">GIÁM ĐỐC</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold; font-size: 13pt;">Nguyễn Chiến Thắng</div>
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
  showToast("Đã lưu URL cấu hình Server thành công!", "success");
  updateSyncBanner();

  if (url) {
    loadScheduleList(true);
  }
}

async function testGoogleScriptConnection() {
  const url = document.getElementById("googleScriptUrlInput").value.trim();
  if (!url) {
    showToast("Vui lòng nhập đường link Server API trước!", "warning");
    return;
  }

  updateConnectionStatusUI(false, "Đang kết nối...");
  try {
    const response = await fetch(`${url}?action=getSchedule`);
    const result = await response.json();
    if (result.success !== undefined) {
      updateConnectionStatusUI(true, "Kết nối Server thành công!");
      showToast("Kết nối Server thành công!", "success");
    } else {
      updateConnectionStatusUI(false, "Không thể kết nối đến Server");
    }
  } catch (error) {
    updateConnectionStatusUI(false, "Lỗi kết nối Server: " + error.message);
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
  const formatted = formatDisplayDate(ddmmyyyy);
  const parts = formatted.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return formatted;
}

/**
 * Chuẩn hóa ngày hiển thị: Chuyển chuỗi ISO hoặc DD/MM/YYYY thành dạng chuẩn DD/MM/YYYY
 */
function formatDisplayDate(dateVal) {
  if (!dateVal) return "";
  const str = String(dateVal).trim();
  // Nếu đã là dạng DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const p = str.split("/");
    return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
  }
  // Nếu là chuỗi ISO UTC từ Google Sheets (ví dụ: 2026-10-19T17:00:00.000Z)
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Giờ Việt Nam là UTC+7
      const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      const day = String(vnTime.getUTCDate()).padStart(2, '0');
      const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
      const year = vnTime.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  // Nếu là dạng YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

/**
 * Chuẩn hóa giờ hiển thị: Chuyển chuỗi ISO hoặc HH:mm thành dạng chuẩn 24h (HH:mm)
 * Xử lý triệt để lỗi lệch giờ 7:23, 8:23 do mốc năm 1899 của Google Apps Script (GMT+07:06:40)
 */
function formatDisplayTime(timeVal) {
  if (!timeVal) return "";
  const str = String(timeVal).trim();
  // Nếu đã là dạng HH:mm hoặc HH:mm:ss
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const p = str.split(":");
    return `${p[0].padStart(2, '0')}:${p[1].padStart(2, '0')}`;
  }
  // Nếu là chuỗi ISO từ Google Sheets (ví dụ: 1899-12-30T01:23:20.000Z hoặc 1899-12-30T00:23:20.000Z)
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Bù trừ chuẩn: Mốc thời gian năm 1899 từ Google Apps Script bị lệch 6 phút 40 giây (LMT GMT+07:06:40)
      const isHistorical = d.getUTCFullYear() < 1910;
      const offsetMs = isHistorical ? (7 * 3600 + 6 * 60 + 40) * 1000 : 7 * 3600 * 1000;
      const vnTime = new Date(d.getTime() + offsetMs);
      const roundedMinutes = Math.round(vnTime.getUTCMinutes() + vnTime.getUTCSeconds() / 60);
      let hours = vnTime.getUTCHours() + Math.floor(roundedMinutes / 60);
      let minutes = roundedMinutes % 60;
      if (hours >= 24) hours = hours % 24;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }
  return str;
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
