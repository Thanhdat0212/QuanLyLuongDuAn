# Bee Academy — Phần 2: Xác thực & Hồ sơ cá nhân

## Use Case phụ trách
UC01 · UC02 · UC03 · UC04 · UC05

## Mô tả
- Đăng ký tài khoản (OTP email 2 bước)
- Đăng nhập / Đăng xuất / Đổi mật khẩu / Quên mật khẩu
- Google OAuth (Supabase GoTrue + sync profile)
- Cập nhật hồ sơ, đổi avatar (upload Supabase Storage)
- JWT ES256/HS256 dual-verifier, Spring Security stateless

## Files phụ trách

### Backend
```
controller/  AuthController.java
             ProfileController.java

service/     AuthService.java
             OtpService.java
             ProfileService.java

config/      JwtAuthenticationFilter.java   (ES256 + HS256 verify)
             SecurityConfig.java            (whitelist public routes)

client/      AuthProviderClient.java
             SupabaseAuthClient.java

model/       Profile.java

repository/  ProfileRepository.java

dto/request/ LoginRequest  RegisterRequest  VerifyOtpRequest
             RequestOtpRequest  ChangePasswordRequest
             ResetPasswordRequest  OAuthSyncRequest

dto/response/ AuthTokenResponse  UserSummaryResponse  ProfileResponse
```

### Frontend
```
api/          authService.ts

store/        useAuthStore.ts   (Zustand persist localStorage)

pages/common/ Login.tsx
              Register.tsx
              OAuthCallbackPage.tsx
              ForgotPassword.tsx

pages/student/ ProfilePage.tsx
               AccountPage.tsx
               AvatarPage.tsx
```

## Hướng dẫn chạy

### 1. Tạo file môi trường
```bash
cp backend/.env.example backend/.env
# Điền: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET
# MAIL_USERNAME, MAIL_PASSWORD (Gmail App Password)
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
