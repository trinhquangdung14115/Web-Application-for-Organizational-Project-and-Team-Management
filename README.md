# Web Application for Organizational Project & Team Management

Ứng dụng quản lý dự án, thành viên và công việc nhóm — gồm **Frontend (React)** và **Backend (Node.js + Express + MongoDB)**.  
Dự án được chia module rõ ràng, dễ mở rộng và triển khai.  


---

##  Cài đặt & Chạy dự án sau khi clone

### 1. Clone project về máy

```bash
git clone https://github.com/<your-username>/Web-Application-for-Organizational-Project-and-Team-Management.git
cd Web-Application-for-Organizational-Project-and-Team-Management

```
### 2. Cài đặt dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:
```bash
cd ../frontend
npm install
```

### 3. Cấu hình biến môi trường

Tạo file .env trong thư mục backend/ dựa theo mẫu .env.example
```bash
PORT=5000
MONGO_URI=<your_mongodb_atlas_connection>
JWT_SECRET=<your_secret_key>
```

### 4. Chạy server
Backend (Node.js + Express):
```bash
cd backend
npm run dev
```
Frontend (React + Vite):
```bash
cd frontend
npm run dev
```

### 5. Cài đặt và Kết nối MongoDB (Local)
1 Cài đặt và Kết nối MongoDB (Local)

Link: https://www.mongodb.com/try/download/community
Đảm bảo chọn “Install MongoDB as a Service” để MongoDB tự khởi động mỗi khi bật máy.

2 Kiểm tra MongoDB đã hoạt động
  
```bash
mongod --version
mongo
```

3 Kết nối MongoDB với dự án
   
Mở thư mục backend/
Tạo file .env nếu chưa có, dựa trên mẫu .env.example
Dán nội dung sau:

```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/project_manager
JWT_SECRET=mysecret
```

4 Chạy server để test kết nối
```bash
cd backend
npm run dev
```
5 Cài đặt MongoDB Compass

https://www.mongodb.com/try/download/compass

Cài đặt theo mặc định (Next → Next → Finish),
Mở Compass, chọn:
```bash
Connection String: mongodb://127.0.0.1:27017
```
Nhấn Connect.
