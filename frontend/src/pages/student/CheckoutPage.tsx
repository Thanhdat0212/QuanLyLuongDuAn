// ═══════════════════════════════════════════════════════════════════════════════
// TRANG THANH TOÁN — CheckoutPage.tsx
//
// VỊ TRÍ TRONG HỆ THỐNG:
//   URL: /checkout
//   Người dùng đến từ: CoursesPage (nút "Mua Ngay" → CourseDetailPage → addToCart → /checkout)
//   Người dùng đi đến: PaymentResultPage (/payment-result?status=success|failure)
//
// LUỒNG THANH TOÁN (GIẢ LẬP):
//   1. User xem giỏ hàng, chọn phương thức VNPay hoặc MoMo
//   2. Nhấn "Xác Nhận Thanh Toán" → mở modal QR Code
//   3. Modal đếm ngược 15 giây (giả lập chờ thanh toán)
//   4. Sau 15 giây → tự động gọi processPaymentSuccess()
//      - enrollCourses(courseIds): ghi các khóa học vào Zustand store (useCourseStore)
//      - navigate('/payment-result?status=success'): chuyển trang
//      - clearCart() được gọi tại PaymentResultPage khi nhận status=success
//   5. User có thể nhấn X để hủy → đóng modal + clearInterval
//
// LƯU Ý QUAN TRỌNG:
//   - clearCart() KHÔNG được gọi ở đây mà ở PaymentResultPage
//     → Lý do: nếu navigate() bị chặn hoặc lỗi, giỏ hàng vẫn còn nguyên
//   - timerRef (useRef) thay vì biến thông thường để tránh stale closure trong setInterval
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, CreditCard, ShieldCheck, QrCode, Loader2, X } from 'lucide-react';
import DashboardHeader from '../../components/DashboardHeader';
import { useCartStore } from '../../store/useCartStore';
import { useCourseStore } from '../../store/useCourseStore';
import { notify } from '../../lib/toast';
import { enrollCourses as enrollCoursesApi } from '../../api/enrollmentService';

export default function CheckoutPage() {
  // ── Store: Giỏ hàng ──────────────────────────────────────────────────────
  // items: danh sách khóa học trong giỏ
  // removeFromCart: xóa một khóa học khỏi giỏ
  // getTotal(): tính tổng tiền (trả về number, đơn vị VNĐ)
  const { items, removeFromCart, getTotal } = useCartStore();

  // ── Store: Khóa học ───────────────────────────────────────────────────────
  // enrollCourses(ids[]): ghi mảng courseId vào purchasedIds trong store
  // → Sau bước này, CoursesPage sẽ hiển thị các khóa học mới trong "Khóa Học Của Tôi"
  const { enrollCourses } = useCourseStore();

  // ── State cục bộ ──────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo'>('vnpay');
  const [showQRModal, setShowQRModal] = useState(false);
  const [countdown, setCountdown] = useState(15); // đếm ngược 15 giây
  const navigate = useNavigate();

  // ── Timer Ref ─────────────────────────────────────────────────────────────
  // Dùng useRef thay vì useState để lưu ID của setInterval.
  // Lý do: timerRef.current không tạo re-render và không bị stale closure —
  //        dù setInterval callback chạy 15 lần, nó luôn đọc đúng giá trị hiện tại.
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Xử lý: Mở Modal QR và bắt đầu đếm ngược ────────────────────────────
  const handleCheckout = () => {
    // Guard: không cho thanh toán nếu giỏ hàng rỗng
    if (items.length === 0) {
      notify.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    // Clear timer cũ nếu user nhấn nút nhiều lần liên tiếp (tránh stacked intervals)
    if (timerRef.current) clearInterval(timerRef.current);

    setShowQRModal(true);
    setCountdown(15);

    // Bắt đầu đếm ngược: mỗi giây giảm countdown đi 1
    // Dùng functional update (prev =>) để tránh stale closure khi đọc giá trị countdown
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Dừng timer ngay khi về 0, rồi xử lý thanh toán thành công
          clearInterval(timerRef.current as NodeJS.Timeout);
          processPaymentSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Xử lý: Thanh toán thành công ─────────────────────────────────────────
  // Được gọi tự động sau 15s đếm ngược, hoặc có thể gọi trực tiếp nếu cần
  const processPaymentSuccess = () => {
    setShowQRModal(false);

    const courseIds = items.map(item => item.id);

    // Bước 1: Ghi vào Zustand store ngay lập tức (UX responsive)
    enrollCourses(courseIds);

    // Bước 2: Đồng bộ enrollment lên backend (fire-and-forget — không block navigation).
    // Khi student vào CourseDetailPage, backend sẽ biết họ đã enrolled
    // và trả về videoUrl đầy đủ cho các bài giảng.
    // Nếu gọi này fail, CourseDetailPage sẽ auto-retry khi load trang.
    enrollCoursesApi(courseIds).catch(() => {
      // Không block UX — CourseDetailPage có cơ chế tự sync khi cần
    });

    // Bước 3: Chuyển đến trang kết quả
    navigate(`/payment-result?status=success`);
  };

  // ── Xử lý: Hủy thanh toán ────────────────────────────────────────────────
  const handleCancelPayment = () => {
    setShowQRModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    notify.error("Đã hủy giao dịch");
    // Không navigate → giỏ hàng vẫn còn nguyên, user có thể thử lại
  };

  // ── Cleanup khi component unmount ─────────────────────────────────────────
  // Ngăn memory leak: nếu user điều hướng đi trong lúc timer đang chạy,
  // interval sẽ bị dọn dẹp thay vì tiếp tục chạy ngầm
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const totalAmount = getTotal();

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <DashboardHeader />

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 md:px-10 py-10">
        <Link to="/courses" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Tiếp tục tìm khóa học
        </Link>

        <h1 className="text-3xl font-extrabold text-on-surface mb-8">Giỏ Hàng Của Bạn</h1>

        {/* Trường hợp giỏ hàng rỗng → hiển thị empty state */}
        {items.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/30">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant">
              <ShoppingCartIcon className="w-10 h-10 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Giỏ hàng trống</h2>
            <p className="text-on-surface-variant mb-6">Bạn chưa chọn khóa học nào. Hãy khám phá các khóa học thú vị của chúng tôi nhé!</p>
            <Link to="/courses" className="inline-flex px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Khám Phá Khóa Học
            </Link>
          </div>
        ) : (
          // Layout 2 cột: danh sách khóa học (trái 2/3) + ô thanh toán (phải 1/3)
          <div className="grid lg:grid-cols-3 gap-10">
            {/* ── Cột trái: Danh sách khóa học trong giỏ ─── */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 flex gap-4 md:gap-6 items-center shadow-sm"
                >
                  <img src={item.image} alt={item.title} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl" />
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-on-surface mb-1 line-clamp-2">{item.title}</h3>
                    <div className="text-primary font-extrabold text-xl">{item.price}</div>
                  </div>
                  {/* Nút xóa: gọi removeFromCart(id) → Zustand cập nhật, component re-render */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Xóa khỏi giỏ hàng"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* ── Cột phải: Ô thanh toán (sticky) ─── */}
            <div className="lg:col-span-1">
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 shadow-xl shadow-primary/5 sticky top-28">
                <h3 className="text-xl font-bold text-on-surface mb-6">Tổng đơn hàng</h3>

                <div className="flex justify-between items-center mb-4 text-on-surface-variant">
                  <span>Tạm tính ({items.length} khóa học):</span>
                  <span className="font-semibold text-on-surface">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>

                <hr className="border-outline-variant/30 my-4" />

                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-on-surface">Tổng cộng:</span>
                  <span className="text-3xl font-extrabold text-primary">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>

                {/* Chọn phương thức thanh toán — state paymentMethod ảnh hưởng màu modal QR */}
                <h4 className="font-bold text-on-surface mb-4">Phương thức thanh toán</h4>
                <div className="space-y-3 mb-8">
                  <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'vnpay' ? 'border-primary' : 'border-outline-variant'}`}>
                      {paymentMethod === 'vnpay' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded font-bold text-[10px] flex items-center justify-center">VNPay</div>
                      <span className="font-semibold text-on-surface">Thanh toán qua VNPay</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'momo' ? 'border-primary' : 'border-outline-variant'}`}>
                      {paymentMethod === 'momo' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#A50064] text-white rounded font-bold text-[10px] flex items-center justify-center">MoMo</div>
                      <span className="font-semibold text-on-surface">Thanh toán qua MoMo</span>
                    </div>
                  </label>
                </div>

                {/* Nút CTA — trigger handleCheckout() */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-6 h-6" />
                  Xác Nhận Thanh Toán
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Thanh toán bảo mật 100%
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL QR CODE THANH TOÁN
          Hiển thị khi showQRModal = true.
          Màu header modal thay đổi theo paymentMethod (xanh=VNPay, tím=MoMo).
          Hiển thị countdown đếm ngược từ 15 về 0.
          Khi countdown = 0 → processPaymentSuccess() được gọi từ bên trong setInterval.
      ════════════════════════════════════════════════════════════════════════ */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header modal — màu phụ thuộc paymentMethod */}
            <div className={`p-4 text-white font-bold flex justify-between items-center ${paymentMethod === 'vnpay' ? 'bg-blue-600' : 'bg-[#A50064]'}`}>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <span>Thanh toán {paymentMethod === 'vnpay' ? 'VNPay' : 'MoMo'}</span>
              </div>
              {/* Nút X → handleCancelPayment() → clearInterval + đóng modal */}
              <button onClick={handleCancelPayment} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold text-on-surface mb-2">Quét mã để thanh toán</h3>
              <p className="text-on-surface-variant text-sm mb-6">Sử dụng ứng dụng {paymentMethod === 'vnpay' ? 'ngân hàng' : 'MoMo'} để quét mã này</p>

              {/* Hình QR giả lập — URL được tạo động từ totalAmount */}
              <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-sm border border-outline-variant/30 mb-6 relative">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MockPayment_${totalAmount}`} alt="QR Code" className="w-full h-full opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                   <Loader2 className={`w-10 h-10 animate-spin ${paymentMethod === 'vnpay' ? 'text-blue-600' : 'text-[#A50064]'}`} />
                </div>
              </div>

              {/* Thông tin đơn hàng tóm tắt */}
              <div className="w-full bg-surface-container rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-on-surface-variant text-sm">Số tiền:</span>
                  <span className="font-bold text-primary">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-sm">Nội dung:</span>
                  <span className="font-semibold text-on-surface">Thanh toán khóa học</span>
                </div>
              </div>

              {/* Hiển thị countdown — cập nhật mỗi giây từ setInterval */}
              <div className="flex items-center gap-2 text-amber-600 font-semibold bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chờ thanh toán... ({countdown}s)
              </div>
              <p className="text-xs text-on-surface-variant mt-4 opacity-70">(Giả lập: Hệ thống tự động xác nhận sau 15 giây để bạn dễ dàng test)</p>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

// SVG icon giỏ hàng fallback (dùng khi giỏ rỗng)
// Định nghĩa nội bộ thay vì import từ lucide để giảm bundle size cho trường hợp hiếm gặp
function ShoppingCartIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
    </svg>
  );
}
