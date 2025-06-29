import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  onValue,
  limitToLast,
  get,
  onChildAdded,
  off,
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

// Debounce function để tránh cập nhật quá nhiều lần
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Lắng nghe tin nhắn từ một cuộc trò chuyện với tối ưu hóa
export const listenToMessages = (
  conversationId: number,
  callback: (messages: any[], isInitialLoad?: boolean) => void,
  onNewMessage?: (message: any) => void
) => {
  if (!conversationId) {
    console.error("No conversation ID provided");
    return () => {};
  }

  console.log(
    `Setting up optimized Firebase Realtime Database listener for conversation ${conversationId}`
  );

  // Tham chiếu đến đường dẫn messages trong Realtime Database
  const messagesRef = ref(database, `conversations/${conversationId}/messages`);

  // Tạo query sắp xếp theo thời gian, giới hạn 50 tin nhắn mới nhất
  const messagesQuery = query(
    messagesRef,
    orderByChild("created_at"),
    limitToLast(50)
  );

  let isInitialLoad = true;
  let lastMessageTimestamp = 0;
  let unsubscribeFunctions: (() => void)[] = [];

  // Debounced callback để tránh cập nhật quá nhiều lần
  const debouncedCallback = debounce((messages: any[], isInitial: boolean) => {
    callback(messages, isInitial);
  }, 100);

  // Listener cho lần load đầu tiên
  const initialUnsubscribe = onValue(
    messagesQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        console.log("Initial Firebase data received:", snapshot.val());

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

        // Cập nhật timestamp của tin nhắn cuối cùng
        if (sortedMessages.length > 0) {
          lastMessageTimestamp = Math.max(
            ...sortedMessages.map(msg => new Date(msg.created_at).getTime())
          );
        }

        console.log(`Parsed ${sortedMessages.length} messages from Firebase (initial load)`);

        // Gọi callback với dữ liệu đã được xử lý
        debouncedCallback(sortedMessages, true);
        isInitialLoad = false;

        // Sau khi load xong, thiết lập listener cho tin nhắn mới
        setupNewMessageListener();
      } else {
        console.log("No messages found for conversation:", conversationId);
        debouncedCallback([], true);
        isInitialLoad = false;
      }
    },
    (error) => {
      console.error("Error listening to Firebase messages:", error);
    }
  );

  unsubscribeFunctions.push(initialUnsubscribe);

  // Hàm thiết lập listener cho tin nhắn mới
  const setupNewMessageListener = () => {
    // Tạo query cho tin nhắn mới hơn timestamp cuối cùng
    const newMessagesQuery = query(
      messagesRef,
      orderByChild("created_at"),
      limitToLast(10) // Chỉ lấy 10 tin nhắn mới nhất để tránh spam
    );

    const newMessageUnsubscribe = onValue(
      newMessagesQuery,
      (snapshot) => {
        if (snapshot.exists() && !isInitialLoad) {
          const messagesObj = snapshot.val();
          const newMessages = Object.keys(messagesObj || {}).map((key) => ({
            id: key,
            ...messagesObj[key],
            user_id: parseInt(messagesObj[key].user_id),
            created_at: new Date(
              messagesObj[key].created_at * 1000
            ).toISOString(),
          }));

          // Lọc chỉ những tin nhắn mới hơn timestamp cuối cùng
          const actualNewMessages = newMessages.filter(
            msg => new Date(msg.created_at).getTime() > lastMessageTimestamp
          );

          if (actualNewMessages.length > 0) {
            console.log(`Received ${actualNewMessages.length} new messages`);
            
            // Cập nhật timestamp cuối cùng
            lastMessageTimestamp = Math.max(
              ...actualNewMessages.map(msg => new Date(msg.created_at).getTime())
            );

            // Gọi callback cho từng tin nhắn mới
            actualNewMessages.forEach(msg => {
              if (onNewMessage) {
                onNewMessage(msg);
              }
            });

            // Gọi callback tổng hợp với tất cả tin nhắn
            debouncedCallback(newMessages, false);
          }
        }
      },
      (error) => {
        console.error("Error listening to new Firebase messages:", error);
      }
    );

    unsubscribeFunctions.push(newMessageUnsubscribe);
  };

  // Trả về hàm để hủy đăng ký lắng nghe
  return () => {
    console.log("Unsubscribing from Firebase listeners");
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions = [];
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
