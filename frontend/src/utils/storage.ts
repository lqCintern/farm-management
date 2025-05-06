// Tạo file mới để quản lý lưu trữ token

// Hàm lưu token
export const saveToken = (token: string) => {
  try {
    // Thử lưu vào localStorage trước
    localStorage.setItem("token", token);
  } catch (e) {
    // Nếu không thể lưu vào localStorage (ví dụ: trong tab ẩn danh), thử lưu vào sessionStorage
    try {
      sessionStorage.setItem("token", token);
    } catch (err) {
      console.error("Không thể lưu token vào bất kỳ storage nào", err);
    }
  }
};

// Hàm lấy token
export const getToken = (): string | null => {
  // Kiểm tra token trong localStorage
  let token = null;
  try {
    token = localStorage.getItem("token");
  } catch (e) {
    // Nếu không thể đọc từ localStorage
    console.log("Không thể đọc từ localStorage");
  }

  // Nếu không có token trong localStorage, kiểm tra sessionStorage
  if (!token) {
    try {
      token = sessionStorage.getItem("token");
    } catch (e) {
      console.log("Không thể đọc từ sessionStorage");
    }
  }

  return token;
};

// Hàm xóa token
export const removeToken = () => {
  try {
    localStorage.removeItem("token");
  } catch (e) {
    console.log("Không thể xóa token từ localStorage");
  }

  try {
    sessionStorage.removeItem("token");
  } catch (e) {
    console.log("Không thể xóa token từ sessionStorage");
  }
};

// Quản lý thông tin người dùng trong storage

export interface UserInfo {
  user_id: number;
  user_name?: string;
  fullname?: string;
  email?: string;
  user_type?: number;
  token?: string;
  // Các thuộc tính khác...
}

// Lưu thông tin người dùng
export const saveUserInfo = (userInfo: UserInfo) => {
  // Đảm bảo user_id luôn là số
  const normalizedUserInfo = {
    ...userInfo,
    user_id: Number(userInfo.user_id),
  };

  try {
    localStorage.setItem("userInfo", JSON.stringify(normalizedUserInfo));
  } catch (e) {
    try {
      sessionStorage.setItem("userInfo", JSON.stringify(normalizedUserInfo));
    } catch (err) {
      console.error("Không thể lưu thông tin người dùng", err);
    }
  }
};

// Lấy thông tin người dùng
export const getUserInfo = (): UserInfo | null => {
  let userInfoStr = null;

  try {
    userInfoStr = localStorage.getItem("userInfo");
  } catch (e) {
    console.log("Không thể đọc thông tin người dùng từ localStorage");
  }

  if (!userInfoStr) {
    try {
      userInfoStr = sessionStorage.getItem("userInfo");
    } catch (e) {
      console.log("Không thể đọc thông tin người dùng từ sessionStorage");
    }
  }

  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr);
      // Đảm bảo user_id luôn là số
      return {
        ...userInfo,
        user_id: Number(userInfo.user_id),
      };
    } catch (e) {
      console.error("Lỗi parse thông tin người dùng", e);
    }
  }

  return null;
};

// Lấy user_id từ thông tin người dùng đã lưu
export const getCurrentUserId = (): number | null => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.user_id : null;
};

// Xóa thông tin người dùng
export const removeUserInfo = () => {
  try {
    localStorage.removeItem("userInfo");
  } catch (e) {
    console.log("Không thể xóa thông tin người dùng từ localStorage");
  }

  try {
    sessionStorage.removeItem("userInfo");
  } catch (e) {
    console.log("Không thể xóa thông tin người dùng từ sessionStorage");
  }
};

// Cập nhật một phần thông tin người dùng
export const updateUserInfo = (partialUserInfo: Partial<UserInfo>) => {
  const currentInfo: Partial<UserInfo> = getUserInfo() || {};
  saveUserInfo({
    ...currentInfo,
    ...partialUserInfo,
    user_id: Number(partialUserInfo.user_id ?? currentInfo.user_id),
  });
};

// Lắng nghe sự thay đổi trong storage
export const addUserInfoChangeListener = (
  callback: (userInfo: UserInfo | null) => void
) => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === "userInfo") {
      callback(getUserInfo());
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Trả về hàm để remove listener
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
};
