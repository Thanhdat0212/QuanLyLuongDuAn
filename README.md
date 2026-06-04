# Bee Academy — Phần 3: Tìm kiếm Khóa học & Enrollment

## Use Case phụ trách
UC06 · UC07 · UC08 · UC09 · UC10

## Mô tả
- Tìm kiếm / lọc khóa học (danh mục, giá, lớp, trạng thái)
- Xem chi tiết khóa học + bài học thử miễn phí (isFree)
- Video private: backend generate signed URL TTL 1 giờ
- Enrollment: học sinh mua → truy cập toàn bộ video
- Specification pattern cho dynamic query, fix enum lowercase

## Files phụ trách

### Backend
```
controller/  CourseController.java
             CategoryController.java
             EnrollmentController.java

service/     CourseService.java      (search + signed URL + video access)
             EnrollmentService.java

model/       Course.java  Chapter.java  Lesson.java
             Category.java  Enrollment.java

repository/  CourseRepository.java
             EnrollmentRepository.java
             spec/CourseSpecifications.java

dto/response/ CourseDetailResponse.java
              ChapterResponse.java
              LessonResponse.java

DB/           supabase_migration_enrollments.sql
```

### Frontend
```
api/           courseService.ts
               enrollmentService.ts
               adapter.ts

pages/student/ CoursesPage.tsx        (danh sách + filter + search)
               CourseDetailPage.tsx   (chi tiết + syllabus + CTA mua)
               CheckoutPage.tsx       (mock — chờ VNPay/MoMo)

data/          mockCourses.ts
types/         api.ts
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
```
