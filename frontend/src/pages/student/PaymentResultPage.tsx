// ═══════════════════════════════════════════════════════════════════════════════
// TRANG KẾT QUẢ THANH TOÁN — PaymentResultPage.tsx
//
// VỊ TRÍ TRONG HỆ THỐNG:
//   URL: /payment-result?status=success  hoặc  /payment-result?status=failure
//   Người dùng đến từ: CheckoutPage (sau khi đếm ngược 15s xong → navigate('/payment-result?status=success'))
//   Người dùng đi đến:
//     - Nếu success → /courses (nút "Vào Học Ngay")
//     - Nếu failure → /checkout (nút "Thử Lại") hoặc /courses (nút "Quay về")
//
// LUỒNG XỬ LÝ:
//   1. Đọc ?status= từ URL (do CheckoutPage set khi navigate)
//   2. Nếu không có status → redirect ngay về /courses (truy cập trực tiếp URL này là không hợp lệ)
//   3. useEffect: nếu status=success → gọi clearCart() để dọn giỏ hàng
//      Lý do clearCart() ở đây chứ không ở CheckoutPage:
//      → Đảm bảo giỏ hàng chỉ bị xóa khi user THỰC SỰ đến trang thành công
//      → Nếu navigate bị lỗi hoặc user back lại, giỏ hàng vẫn còn nguyên
//   4. Render UI theo isSuccess: icon xanh (thành công) hoặc icon đỏ (thất bại)
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

export default function PaymentResultPage() {
  // ── Đọc query param từ URL ────────────────────────────────────────────────
  // useSearchParams() đọc phần ?... trong URL.
  // CheckoutPage gọi navigate('/payment-result?status=success') sau khi thanh toán.
  // status có thể là: 'success', 'failure', hoặc null (truy cập trực tiếp)
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const navigate = useNavigate();

  // ── Store: Giỏ hàng ───────────────────────────────────────────────────────
  // clearCart(): xóa toàn bộ items trong giỏ hàng (Zustand store)
  // Chỉ gọi khi status=success để đảm bảo thanh toán đã hoàn tất
  const clearCart = useCartStore(state => state.clearCart);

  // ── Dọn giỏ hàng sau thanh toán thành công ───────────────────────────────
  // useEffect chạy 1 lần khi component mount (và khi status/clearCart thay đổi).
  // Phụ thuộc [status, clearCart] đảm bảo effect luôn dùng giá trị mới nhất.
  useEffect(() => {
    if (status === 'success') {
      clearCart();
    }
  }, [status, clearCart]);

  // ── Guard: truy cập không hợp lệ ─────────────────────────────────────────
  // Nếu URL là /payment-result (không có ?status=) → điều hướng về trang khóa học
  // return null để dừng render trong khi navigate() đang xử lý
  if (!status) {
    navigate('/courses');
    return null;
  }

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Hiệu ứng nền blur — xanh lá khi thành công, đỏ khi thất bại */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] opacity-20 pointer-events-none ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />

      {/* Card kết quả — animate fade in + scale từ 90% → 100% */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-10 md:p-14 shadow-2xl w-full max-w-lg text-center relative z-10"
      >
        {/* Icon kết quả — spring animation với bounce effect */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          {isSuccess ? (
            <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <XCircle className="w-14 h-14" />
            </div>
          )}
        </motion.div>

        {/* Tiêu đề và mô tả kết quả */}
        <h1 className="text-3xl font-extrabold text-on-surface mb-4">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h1>

        <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
          {isSuccess
            ? 'Cảm ơn bạn đã tin tưởng Bee Academy. Các khóa học đã được thêm vào tài khoản của bạn. Hãy bắt đầu hành trình học tập ngay thôi!'
            : 'Đã có lỗi xảy ra trong quá trình thanh toán hoặc bạn đã hủy giao dịch. Giỏ hàng của bạn vẫn được giữ nguyên.'}
        </p>

        {/* ── Nút hành động ─────────────────────────────────────────────────
            Thành công: 1 nút "Vào Học Ngay" → /courses
                        (khóa học đã được enroll trong Zustand, CoursesPage hiển thị ngay)
            Thất bại:   2 nút:
              - "Thử Lại Thanh Toán" → /checkout (giỏ hàng vẫn còn, không bị xóa)
              - "Quay về trang chủ" → /courses
        ─────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {isSuccess ? (
            <>
              <Link
                to="/courses"
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Vào Học Ngay <ArrowRight className="w-5 h-5" />
              </Link>
            </>
          ) : (
            <>
              {/* Quay lại checkout — giỏ hàng vẫn nguyên vẹn, status=failure không xóa cart */}
              <Link
                to="/checkout"
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Thử Lại Thanh Toán
              </Link>
              <Link
                to="/courses"
                className="w-full py-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-bold text-lg transition-colors"
              >
                Quay về trang chủ
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
