# Farm Management System

Hệ thống quản lý nông trại bao gồm hai phần chính:
1. **Backend**: API được xây dựng bằng Ruby on Rails.
2. **Frontend**: Giao diện người dùng được xây dựng bằng React + TypeScript.

---

## Yêu cầu hệ thống

### Backend
- Ruby 3.2.3
- Rails 8.0.2
- MySQL 5.7 hoặc cao hơn

### Frontend
- Node.js 18.x
- npm 9.x hoặc cao hơn

---

## Hướng dẫn cài đặt và chạy dự án

### 1. Clone dự án
```bash
git clone <repository-url>
cd farm-management
```

---

### 2. Cài đặt và chạy **Backend**

#### 2.1. Cài đặt gem
```bash
cd backend
bundle install
```

#### 2.2. Cấu hình cơ sở dữ liệu
- Mở file `backend/config/database.yml` và đảm bảo thông tin cấu hình đúng với môi trường của bạn.
- Tạo cơ sở dữ liệu:
```bash
rails db:create
rails db:migrate
```

#### 2.3. Chạy server backend
```bash
rails server -p 3000
```
- Backend sẽ chạy tại: `http://localhost:3000`.

---

### 3. Cài đặt và chạy **Frontend**

#### 3.1. Cài đặt dependencies
```bash
cd frontend
npm install
```

#### 3.2. Chạy server frontend
```bash
npm run dev
```
- Frontend sẽ chạy tại: `http://localhost:5173`.

## Ghi chú
- Đảm bảo backend và frontend chạy trên các cổng khác nhau (`3000` cho backend và `5173` cho frontend).
- Nếu gặp lỗi CORS, kiểm tra cấu hình CORS trong file `backend/config/application.rb`.

---

## Liên hệ
Nếu bạn gặp vấn đề hoặc cần hỗ trợ, vui lòng liên hệ qua email: `lqci.cql@gmail.com`.
