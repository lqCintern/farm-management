require "google/cloud/firestore"

# Đường dẫn đến tệp credentials
credentials_path = File.join(Rails.root, "config/firebase-key.json")

# Khởi tạo Firestore với project_id cố định
FIREBASE_FIRESTORE = Google::Cloud::Firestore.new(
  project_id: "farm-management-4f61c",
  credentials: credentials_path
)
