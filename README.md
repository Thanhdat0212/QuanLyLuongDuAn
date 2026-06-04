# Bee Academy — Phần 5: Parent Portal

## Use Case phụ trách
UC24 · UC25 · UC26 · UC27 · UC28 · UC29

## Mô tả
- Phụ huynh theo dõi tiến độ học tập của con (% hoàn thành, điểm quiz)
- Liên kết tài khoản PH ↔ HS: gửi lời mời / chấp nhận / hủy liên kết
- Xem lịch sử thanh toán khóa học
- Liên hệ giáo viên & nhận thông báo
- Zustand store: linkedStudents — persist qua F5 reload

## Files phụ trách

### Backend
```
controller/  ParentController.java

service/     ParentService.java

model/       ParentStudentLink.java

repository/  ParentStudentLinkRepository.java
```

### Frontend
```
api/          parentService.ts

store/        useAuthStore.ts   (phần linkedStudents, fetchLinkedStudents,
                                 unlinkStudent)

pages/parent/ ParentDashboard.tsx
              ParentCourses.tsx
              ParentProgress.tsx
              ParentMessages.tsx
              ParentStudentLink.tsx
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
# Đăng nhập bằng tài khoản có role=parent
```
