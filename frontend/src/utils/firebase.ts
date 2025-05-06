import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  onValue,
  limitToLast,
  get,
} from "firebase/database";

// Cấu hình Firebase - Sử dụng cho client side
const firebaseConfig = {
  apiKey: "AIzaSyA00YfTlZXnDbjB3DU19k6WlqlOiTFFJkQ",
  authDomain: "farm-management-4f61c.firebaseapp.com",
  databaseURL:
    "https://farm-management-4f61c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farm-management-4f61c",
  storageBucket: "farm-management-4f61c.appspot.com",
  messagingSenderId: "707506467977",
  appId: "1:707506467977:web:9a95d14dda0a6b90a7e34f",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Lắng nghe tin nhắn từ một cuộc trò chuyện
export const listenToMessages = (
  conversationId: number,
  callback: (messages: any[]) => void
) => {
  if (!conversationId) {
    console.error("No conversation ID provided");
    return () => {};
  }

  console.log(
    `Setting up Firebase Realtime Database listener for conversation ${conversationId}`
  );

  // Tham chiếu đến đường dẫn messages trong Realtime Database
  const messagesRef = ref(database, `conversations/${conversationId}/messages`);

  // Tạo query sắp xếp theo thời gian, giới hạn 50 tin nhắn mới nhất
  const messagesQuery = query(
    messagesRef,
    orderByChild("created_at"),
    limitToLast(50)
  );

  // Thiết lập listener
  const unsubscribe = onValue(
    messagesQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        console.log("Firebase data received:", snapshot.val());

        // Chuyển đổi dữ liệu từ object thành array
        const messagesObj = snapshot.val();
        const messagesArray = Object.keys(messagesObj || {}).map((key) => ({
          id: key,
          ...messagesObj[key],
          // Đảm bảo user_id là number
          user_id: parseInt(messagesObj[key].user_id),
          // Chuyển đổi timestamp thành ISO string
          created_at: new Date(
            messagesObj[key].created_at * 1000
          ).toISOString(),
        }));

        // Sắp xếp theo thời gian
        const sortedMessages = messagesArray.sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        );

        console.log(`Parsed ${sortedMessages.length} messages from Firebase`);

        // Gọi callback với dữ liệu đã được xử lý
        callback(sortedMessages);
      } else {
        console.log("No messages found for conversation:", conversationId);
        callback([]);
      }
    },
    (error) => {
      console.error("Error listening to Firebase messages:", error);
    }
  );

  // Trả về hàm để hủy đăng ký lắng nghe
  return () => {
    console.log("Unsubscribing from Firebase listener");
    unsubscribe();
  };
};

// Test kết nối Firebase
export const testFirebaseConnection = async () => {
  try {
    const testRef = ref(database, "conversations");
    const snapshot = await get(testRef);

    console.log(
      "Firebase connection test:",
      snapshot.exists() ? "Connection successful" : "No data available"
    );

    return snapshot.exists();
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return false;
  }
};
