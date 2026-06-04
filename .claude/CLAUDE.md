# CLAUDE.md — Bee Academy

Tài liệu này ghi lại trạng thái hiện tại của **toàn bộ dự án** (frontend + backend), những gì đã hoàn thành, quyết định kiến trúc quan trọng và những phần còn dang dở.

Cập nhật lần cuối: 2026-05-31

---

## Tech Stack thực tế

### Frontend

> **Lưu ý:** File `rules/tech-stack.md` mô tả Next.js + Spring Boot, nhưng dự án **thực tế đang dùng:**

| Layer | Công nghệ |
|---|---|
| Framework | **React 19 + Vite 6** (không phải Next.js) |
| Routing | **React Router DOM v7** |
| Styling | **Tailwind CSS v4** với CSS variables Material Design 3 |
| State | **Zustand v5** (persist localStorage cho auth) |
| Animation | **motion/react** (alias của Framer Motion) |
| Icons | Lucide React |
| Toast | react-hot-toast (`notify` wrapper tại `src/lib/toast.ts`) |
| HTTP | Axios với `apiClient` singleton + interceptor tự gắn Bearer token |

### Backend

| Layer | Công nghệ |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.2 |
| Architecture | MVC, Spring Security (stateless JWT) |
| Database | PostgreSQL qua Supabase |
| Auth Provider | Supabase GoTrue (JWT ES256 / ECDSA P-256) |
| Email | JavaMailSender (SMTP Gmail) |
| Env loader | spring-dotenv (đọc `backend/.env`) |
| Build | Maven |

### CSS Variables (Material Design 3)
Dùng trong toàn bộ UI — **không dùng màu Tailwind trực tiếp cho surface/text:**
- `bg-surface`, `bg-surface-container`, `bg-surface-container-lowest`, `bg-surface-container-low`, `bg-surface-container-high`
- `text-on-surface`, `text-on-surface-variant`
- `border-outline-variant`
- `bg-primary`, `text-on-primary`, `text-primary`

---

## Cấu trúc File

### Frontend
```
frontend/src/
├── App.tsx                          ← Router + ProtectedRoute guard (role-based)
├── api/
│   ├── client.ts                    ← apiClient (axios singleton + interceptor)
│   ├── authService.ts               ← login, register, logout, refresh, syncOAuthProfile
│   ├── courseService.ts             ← GET /api/courses, GET /api/courses/:id
│   ├── parentService.ts             ← getLinkedChildren, unlinkStudent, getChildOverview
│   ├── teacherCourseService.ts      ← ✅ CRUD course/chapter/lesson + upload video/doc
│   ├── questionService.ts           ← ✅ CRUD câu hỏi ngân hàng
│   └── quizService.ts               ← ✅ Config quiz + student làm bài
├── components/
│   ├── ProtectedRoute.tsx           ← ✅ Auth guard: redirect /login nếu chưa đăng nhập
│   ├── DashboardHeader.tsx
│   ├── DashboardSidebar.tsx
│   └── PageBanner.tsx
├── pages/
│   ├── common/   Login, Register, LandingPage, OAuthCallbackPage, ForgotPassword
│   ├── student/  CoursesPage✅, CourseDetailPage✅, ProfilePage✅, AccountPage✅, AvatarPage✅, ...
│   ├── parents/  ParentDashboard✅, ParentCourses✅, ParentProgress✅, ParentMessages✅, ParentStudentLink✅
│   ├── teacher/
│   │   ├── CoursesPage.tsx          ← ✅ Kết nối API thật (listMyCourses, submitForReview)
│   │   ├── ContentPage.tsx          ← ⚠️ Skeleton (cần kết nối chapter/lesson API)
│   │   ├── QuestionBankPage.tsx     ← ✅ Kết nối API thật (listQuestions + filter)
│   │   ├── QuizPage.tsx             ← ✅ Form config quiz + stats ngân hàng câu hỏi
│   │   └── ...                      các trang GV khác còn skeleton
│   └── admin/
│       ├── DashboardAdmin.tsx       ← ✅ Cơ bản (mock data)
│       ├── ApprovalsPage.tsx        ← ✅ Queue duyệt khóa học
│       └── CourseReviewPage.tsx     ← ✅ Xem + approve/reject/revise
└── data/
    └── mockCourses.ts               ← Còn dùng cho một số phần học sinh
```

### Backend
```
backend/src/main/java/com/beeacademy/backend/
├── controller/
│   ├── AuthController.java          ← /api/auth/** (UC01-UC04 + OAuth)
│   ├── CourseController.java        ← /api/courses (public)
│   ├── ProfileController.java       ← /api/me (get/update/avatar)
│   ├── ParentController.java        ← /api/parent/**
│   ├── TeacherCourseController.java ← ✅ /api/teacher/courses (CRUD + submit)
│   ├── UploadController.java        ← ✅ /api/upload/video + /api/upload/document
│   ├── AdminApprovalController.java ← ✅ /api/admin/courses/pending + approve/reject/revise
│   ├── QuestionController.java      ← ✅ /api/teacher/questions (CRUD ngân hàng)
│   ├── QuizController.java          ← ✅ /api/teacher/.../quiz-config + /api/student/quiz
│   └── HealthController.java
├── service/
│   ├── AuthService.java, OtpService.java, ProfileService.java
│   ├── CourseService.java           ← UC06-UC08 (public listing + video access)
│   ├── ParentService.java           ← UC23-UC25
│   ├── TeacherCourseService.java    ← ✅ Course/Chapter/Lesson CRUD (dùng repo trực tiếp)
│   ├── ContentUploadService.java    ← ✅ Upload video (private) + doc (public) + signed URL
│   ├── ApprovalService.java         ← ✅ Admin approve/reject/revise + lịch sử duyệt
│   ├── QuestionService.java         ← ✅ CRUD + stats ngân hàng câu hỏi
│   └── QuizService.java             ← ✅ Config + random pick + grading + snapshot
├── model/
│   ├── Profile.java, Course.java, Chapter.java, Lesson.java (có business methods)
│   ├── Category.java, ParentStudentLink.java, Enrollment.java
│   ├── CourseDocument.java          ← ✅ PDF/slide đính kèm bài giảng
│   ├── ApprovalHistory.java         ← ✅ Lịch sử duyệt của Admin
│   ├── Question.java                ← ✅ Câu hỏi ngân hàng
│   ├── QuestionChoice.java          ← ✅ Đáp án lựa chọn
│   ├── QuizConfig.java              ← ✅ Config quiz từng chương
│   └── QuizAttempt.java             ← ✅ Lượt làm bài của học sinh (JSONB snapshot)
├── repository/
│   ├── ProfileRepository, CourseRepository, CategoryRepository
│   ├── ParentStudentLinkRepository, EnrollmentRepository
│   ├── ChapterRepository            ← ✅ findByIdAndCourseId, findByCourseId
│   ├── LessonRepository             ← ✅ findByIdAndChapterId, countByChapterId
│   ├── CourseDocumentRepository     ← ✅
│   ├── ApprovalHistoryRepository    ← ✅
│   ├── QuestionRepository           ← ✅ findActive, countByDifficulty, incrementUsage
│   ├── QuizConfigRepository         ← ✅
│   └── QuizAttemptRepository        ← ✅
└── client/
    ├── SupabaseStorageClient.java   ← upload + delete + generateSignedUrl (✅ mới thêm)
    └── SupabaseAuthClient.java, AuthProviderClient.java
```

### SQL cần chạy trên Supabase
File: `backend/supabase_migration_teacher_quiz.sql`
Tạo: 3 enums + 6 bảng mới (course_documents, course_approval_history, questions, question_choices, quiz_configs, quiz_attempts)

---

## UseCase v6.5 — Business Model (Admin chuyển khoản thủ công)

> **Phiên bản UseCase hiện tại: v6.5** (thay thế v6.3). Tài liệu gốc: `BEE ACADEMY.md`.

| Hạng mục | v6.3 (cũ) | v6.5 (hiện tại) |
|---|---|---|
| Mô hình | Marketplace + Stripe Connect | **Admin giữ tiền, chuyển khoản thủ công cuối kỳ** |
| Thanh toán | Stripe Connect (auto split) | **VNPay / MoMo** — tiền về TK công ty |
| Chia doanh thu | Tự động qua Stripe | Hệ thống ghi `revenue_splits`, **Admin chuyển tay** |
| Số UC | 40 (8 module) | **48 (9 module, 7 actor)** |
| TK GV | Stripe Connect | GV tự nhập **TK ngân hàng** (UC45-46) |
| Phụ huynh | Cơ bản | **Module riêng 6 UC** — link mời/chấp nhận (UC47-49) |
| Chứng chỉ | Không | **Module 9** — tự cấp khi pass cuối khóa (UC42-43) |
| Khiếu nại | Không | **UC11** thay cho hoàn tiền |
| Livestream / lịch cố định | — | **Không có** |

---

## Routes đã đăng ký (App.tsx)

### Auth / Common Routes

| Route | Component | Trạng thái |
|---|---|---|
| `/` | LandingPage | ✅ |
| `/login` | Login | ✅ (email/password + Google button) |
| `/register` | Register | ✅ |
| `/auth/callback` | OAuthCallbackPage | ✅ Google OAuth callback |

### Student Routes (bảo vệ bởi ProtectedRoute)

| Route | Component | Trạng thái |
|---|---|---|
| `/courses` | CoursesPage | ✅ Kết nối API thật |
| `/courses/:id` | CourseDetailPage | ✅ Kết nối API thật |
| `/checkout` | CheckoutPage | ⚠️ Mock |
| `/payment-result` | PaymentResultPage | ⚠️ Mock |
| `/orders` | OrdersPage | ✅ |
| `/favorites` | FavoritesPage | ✅ |
| `/messages` | MessagesPage | ✅ |
| `/profile` | ProfilePage | ✅ Kết nối API thật |
| `/account` | AccountPage | ✅ Kết nối API thật |
| `/account/photo` | AvatarPage | ✅ Hoàn chỉnh |

### Teacher Routes (role=teacher)

| Route | Component | Trạng thái |
|---|---|---|
| `/teacher` | DashboardTeacher | ⏳ Skeleton |
| `/teacher/courses` | CoursesPage (teacher) | ✅ Kết nối API + submit duyệt |
| `/teacher/content` | ContentPage | ⚠️ Skeleton (cần wire chapter/lesson API) |
| `/teacher/quiz` | QuizChapterPage | ⏳ Skeleton |
| `/teacher/questions` | QuestionBankPage | ✅ Kết nối API thật |
| `/teacher/bank` | BankPage (TK ngân hàng) | ⏳ Skeleton |
| `/teacher/exam` | ExamPage | ⏳ Skeleton |
| `/teacher/grades` | GradesPage | ⏳ Skeleton |
| `/teacher/qa` | QAPage | ⏳ Skeleton |
| `/teacher/revenue` | RevenuePage | ⏳ Skeleton |

### Admin Routes (role=admin)

| Route | Component | Trạng thái |
|---|---|---|
| `/admin` | DashboardAdmin | ✅ Cơ bản (mock data) |
| `/admin/approvals` | ApprovalsPage | ✅ Danh sách chờ duyệt |
| `/admin/approvals/:courseId` | CourseReviewPage | ✅ Duyệt / từ chối / yêu cầu sửa |
| `/admin/reports` | ComingSoonPage | ⏳ |

### Parent Routes (role=parent)

| Route | Component | Trạng thái |
|---|---|---|
| `/parent` | ParentDashboard | ✅ Kết nối API thật |
| `/parent/courses` | ParentCourses | ✅ |
| `/parent/progress` | ParentProgress | ✅ |
| `/parent/messages` | ParentMessages | ✅ |
| `/parent/link` | ParentStudentLink | ✅ |

---

## Trạng thái Backend — Auth Module ✅

Tất cả endpoint trong `/api/auth/**` đã hoàn thành và hoạt động:

| Endpoint | Mô tả | Trạng thái |
|---|---|---|
| `POST /api/auth/register/request-otp` | Gửi OTP 6 số đến email | ✅ |
| `POST /api/auth/register/verify-otp` | Xác minh OTP + tạo tài khoản | ✅ |
| `POST /api/auth/register` | Đăng ký trực tiếp (không OTP) | ✅ |
| `POST /api/auth/login` | Đăng nhập email/password | ✅ |
| `POST /api/auth/logout` | Đăng xuất (revoke refresh token) | ✅ |
| `POST /api/auth/refresh` | Đổi refresh_token lấy access_token mới | ✅ |
| `POST /api/auth/reset-password` | Gửi email reset password | ✅ |
| `POST /api/auth/change-password` | Đổi mật khẩu (cần JWT) | ✅ |
| `POST /api/auth/oauth/sync` | Sync profile sau Google OAuth (cần JWT) | ✅ |

---

## Lưu ý quan trọng cho phát triển tiếp theo

### JWT & Supabase

**Supabase dùng ES256 (ECDSA P-256), KHÔNG phải HS256.**

- Public key lấy từ JWKS endpoint: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (không phải `/.well-known/jwks.json`)
- `JwtAuthenticationFilter` tự fetch JWKS khi khởi động, build `es256Verifier`
- HS256 verifier vẫn có như fallback (self-hosted Supabase)
- Thuật toán được detect tự động từ JWT header field `alg`
- **Nếu ES256 verifier = null** (JWKS fetch thất bại khi startup): JWT của Supabase production sẽ không pass. Kiểm tra log: `ES256 verifier sẵn sàng (kid=...)`

### OTP & Email

- `OtpService` có flag `DEV_MODE` (`app.dev-mode: ${DEV_MODE:false}` trong `application.yml`)
- Khi `DEV_MODE=true`: nếu SMTP lỗi, **swallow exception và log OTP ra console** thay vì crash
- `backend/.env` hiện có `DEV_MODE=true` — nhớ đổi thành `false` khi deploy production
- **Gmail App Password đã bị xóa** khỏi `backend/.env` — cần tạo lại App Password mới tại myaccount.google.com → Security → App passwords trước khi bật email thực
- Email gửi từ `thuthuycan5@gmail.com` (cấu hình trong `MAIL_USERNAME`)

### Google OAuth Flow

Luồng hoàn chỉnh:
1. User click "Tiếp tục với Google" → `window.location.href = buildGoogleOAuthUrl()` (trong `Login.tsx`)
2. URL: `{SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=http://localhost:3000/auth/callback`
3. Google consent → Supabase xử lý → redirect về `/auth/callback#access_token=...&refresh_token=...`
4. `OAuthCallbackPage` parse hash → tạo **standalone axios instance riêng** (không dùng `apiClient`) để tránh interceptor ghi đè token cũ
5. Gọi `POST /api/auth/oauth/sync` với Bearer token OAuth mới
6. Backend verify ES256 JWT → `CurrentUser.required()` → `syncOAuthProfile()` (idempotent)
7. Frontend nhận `UserSummary` → `loginWithTokens()` → redirect `/courses`

**Tại sao không dùng `apiClient` trong OAuthCallbackPage:**
`apiClient` có request interceptor tự đọc token từ Zustand store. Nếu user trước đó đã login bằng email/password, Zustand persist sẽ còn token cũ → interceptor ghi đè token OAuth mới → backend nhận JWT cũ → 401. Giải pháp: `axios.create()` riêng trong `OAuthCallbackPage`.

### `syncOAuthProfile` là Idempotent

Google user đăng nhập lần đầu **không cần đăng ký trước** — `syncOAuthProfile` tự tạo profile với `role = STUDENT`. Gọi lại nhiều lần với cùng `userId` đều an toàn.

### Backend `.env` Structure

File `backend/.env` (không commit — đã gitignore) cần có:
```
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...         # base64 string (dùng cho HS256 fallback)
SUPABASE_DB_HOST=...
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=...
MAIL_USERNAME=thuthuycan5@gmail.com
MAIL_PASSWORD=...               # Gmail App Password (cần tạo lại)
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
DEV_MODE=true                   # Đổi false khi deploy
```

### `UnauthorizedException` mặc định 401

File `exception/UnauthorizedException.java` đã được sửa để default `HttpStatus.UNAUTHORIZED` (401), không phải 403. Nếu muốn trả 403 (đã login nhưng không có quyền), dùng constructor 3 tham số: `new UnauthorizedException("code", "msg", HttpStatus.FORBIDDEN)`.

---

## Bug đã fix

### ✅ `course_status` enum mismatch
**Đã sửa tại** `CourseSpecifications.onlyPublished()`: dùng `CourseStatus.PUBLISHED.toDbValue()` (`"published"` lowercase) thay vì truyền enum object → Hibernate không gọi `.name()` sinh uppercase nữa.

### ✅ Enrollment luôn trả false
**Đã sửa**: tạo bảng `enrollments` + `EnrollmentRepository` + `CourseService.canUserAccessAllVideos()` gọi `existsByUserIdAndCourseId()` thật.

### ✅ ParentService hardcode tên học sinh
**Đã sửa**: xóa toàn bộ `if (name.contains("Minh Anh"))` — trả `grade: ""` kèm TODO rõ ràng (bảng profiles chưa có cột grade).

### ✅ TeacherCourseService dùng removeIf trên unmodifiable list
**Đã sửa**: thay bằng `chapterRepository.delete()` và `lessonRepository.delete()` trực tiếp.

---

## Trạng thái tích hợp Frontend ↔ Backend

| Phần | Trạng thái |
|---|---|
| Auth (login/register/logout/refresh) | ✅ Kết nối qua `authService.ts` |
| Google OAuth | ✅ Hoạt động end-to-end |
| Danh sách khóa học (`/courses`) | ✅ Kết nối API thật |
| Chi tiết khóa học (`/courses/:id`) | ✅ Kết nối API thật |
| Hồ sơ & Tài khoản | ✅ Kết nối API thật |
| Avatar upload | ✅ Kết nối API thật |
| Auth guards (ProtectedRoute) | ✅ Toàn bộ routes cần auth đều được bảo vệ |
| Parent portal | ✅ Backend xong + FE kết nối API thật |
| Teacher: CRUD khóa học + submit duyệt | ✅ Backend + FE kết nối |
| Teacher: Upload video (private) + doc | ✅ Backend xong (FE cần thêm UI upload) |
| Admin: Duyệt khóa học | ✅ Backend + FE kết nối |
| Ngân hàng câu hỏi | ✅ Backend + FE kết nối |
| Quiz config + làm bài + chấm điểm | ✅ Backend xong (FE cần trang student quiz) |
| Checkout / Payment | ⚠️ Mock, chưa tích hợp VNPay/MoMo |

---

## Còn lại cần làm (theo thứ tự ưu tiên)

### ⚠️ Bắt buộc trước khi chạy backend mới
1. **Chạy `backend/supabase_migration_teacher_quiz.sql`** trên Supabase SQL Editor
2. **Tạo 2 Storage buckets** trên Supabase Dashboard:
   - `course-videos` → **Private** (video bài giảng)
   - `course-docs` → **Public** (PDF, slide)

### Ưu tiên cao
3. **ContentPage wire API** — kết nối chapter/lesson CRUD với `teacherCourseService` thật (hiện còn mock)
4. **Trang student làm quiz** — `/courses/:id/chapters/:chId/quiz` → gọi `quizService.startAttempt` + `submitQuiz`
5. **VNPay / MoMo checkout** — thay mock, tạo bảng `orders` + `order_items`

### Ưu tiên trung bình
6. **Teacher portal** — ContentPage nâng cao, DashboardTeacher (doanh thu realtime)
7. **Admin users** — quản lý tài khoản (UC35), payouts (UC39-40)
8. **Parent link invite** — UC47: gửi email mời liên kết con qua email

### Ưu tiên thấp hơn
9. **Chứng chỉ** — UC42-UC43 (`/certificates`)
10. **`useCartStore` persist localStorage**
11. **Search header** — kết nối API thay vì search mock

---

## Quyết định kiến trúc quan trọng

### 1. Sidebar student là floating dropdown, không cố định trên trang
**Quyết định**: `DashboardSidebar` chỉ xuất hiện khi click avatar trong header.

**Lý do**: Không chiếm diện tích màn hình thường xuyên, user chủ động truy cập.

**Cách thực hiện**: prop `floating=true` bỏ `sticky`, tăng shadow. Header render bên trong `AnimatePresence`.

### 2. Một component DashboardSidebar duy nhất cho cả 2 chế độ
**Quyết định**: Không tạo `DropdownMenu` riêng — dùng lại `DashboardSidebar` với `floating={true}`.

**Lý do**: Đảm bảo `MENU_ITEMS` luôn đồng nhất. Chỉ có 1 nguồn dữ liệu.

### 3. Luồng mua hàng: "Thêm vào giỏ" chỉ khi đã đăng nhập
**Quyết định**: Nút "Thêm vào giỏ hàng" trong `MarketingView`:
- Chưa login → `navigate('/login', { state: { from: /courses/:id } })` — không toast
- Đã login → `addToCart` + toast

### 4. Login redirect dùng `location.state.from`
**Quyết định**: Sau login thành công, `navigate(location.state?.from ?? '/courses', { replace: true })`.

**Lý do**: User nhấn "Thêm vào giỏ" khi chưa login → sang login → sau khi login quay đúng về trang khóa học vừa xem.

### 5. OAuthCallbackPage dùng standalone axios, không dùng apiClient
**Quyết định**: `axios.create()` riêng trong `OAuthCallbackPage` thay vì import `apiClient`.

**Lý do**: `apiClient` có interceptor tự đọc token từ Zustand persist — nếu có session cũ sẽ ghi đè token OAuth mới, gây 401.

### 6. syncOAuthProfile idempotent — Google user không cần đăng ký trước
**Quyết định**: Backend tự tạo profile `STUDENT` nếu chưa tồn tại khi Google OAuth sync.

**Lý do**: Không thể yêu cầu user đã đăng nhập bằng Google lại phải làm thêm bước đăng ký — UX quá tệ.

### 7. Admin sidebar: gộp Học viên + Giáo viên → "Quản lý người dùng"
**Quyết định**: Một mục "Quản lý người dùng" thay cho 2 mục riêng biệt.

**Lý do**: Đơn giản hóa sidebar, quản lý theo vai trò (role-based) trong cùng một trang.

### 8. Toolbar B/I dùng Markdown syntax
**Quyết định**: Toolbar Bold/Italic trong ProfilePage chèn `**text**` / `*text*` vào textarea thuần.

**Lý do**: Không muốn thêm rich text editor (Quill, TipTap) cho MVP.

### 9. TeacherCourseService dùng ChapterRepository/LessonRepository trực tiếp
**Quyết định**: Không mutate `Course.getChapters()` hay `Chapter.getLessons()` để add/delete — dùng repo riêng.

**Lý do**: `getChapters()` và `getLessons()` trả `Collections.unmodifiableList()` — gọi `add()`/`remove()` ném `UnsupportedOperationException`. Dùng repo trực tiếp rõ ràng hơn và tránh N+1 khi không cần load toàn bộ collection.

### 10. Quiz snapshot JSONB — nguồn sự thật cho chấm điểm
**Quyết định**: `quiz_attempts.questions_snapshot` (JSONB) lưu toàn bộ câu hỏi + đáp án đúng tại lúc bắt đầu làm bài.

**Lý do**: GV có thể sửa/xóa câu hỏi sau mà không ảnh hưởng bài đã làm. Khi chấm điểm chỉ dùng snapshot, không query lại `questions` table.

### 11. Video private bucket — lưu storagePath, không lưu URL
**Quyết định**: `Lesson.videoStoragePath` lưu path trong bucket `course-videos` (private), không phải URL. Khi học sinh xem, backend generate signed URL TTL 1 giờ.

**Lý do**: Video trong public URL sẽ bị truy cập trực tiếp không qua auth. Signed URL tự hết hạn bảo vệ nội dung có phí.
