# Bee Academy — Phần 4: Admin Portal

## Use Case phụ trách
UC38 · UC39 · UC40 · UC41

## Mô tả
- Dashboard Admin: tổng quan hệ thống
- Quản lý tài khoản người dùng: danh sách, block/unblock, đổi role, thống kê
- Duyệt khóa học: Approve / Reject / Needs Revision + lịch sử duyệt
- ProtectedRoute: bảo vệ toàn bộ route cần đăng nhập theo role
- App.tsx: đăng ký tất cả routes có role guard

## Files phụ trách

### Backend
```
controller/  AdminApprovalController.java
             AdminUserController.java

service/     ApprovalService.java

model/       ApprovalHistory.java

repository/  ApprovalHistoryRepository.java

dto/request/ ApprovalActionRequest.java

dto/response/ PendingCourseResponse.java
              ApprovalHistoryResponse.java
              AdminUserResponse.java
```

### Frontend
```
components/  ProtectedRoute.tsx        (auth + role guard cho toàn app)

src/         App.tsx                   (router + tất cả routes)

pages/admin/ ApprovalsPage.tsx         (danh sách khóa học chờ duyệt)
             CourseReviewPage.tsx      (xem + approve/reject/revise)
             DashboardAdmin.tsx        (dashboard tổng quan)
```

## Hướng dẫn chạy

### 1. Tạo file môi trường
```bash
cp backend/.env.example backend/.env
```

### 2. Chạy Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Chạy Frontend
```bash
cd frontend
npm install
npm run dev
# Mở http://localhost:3000
# Đăng nhập bằng tài khoản có role=admin
```
