import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShieldCheck, QrCode, Loader2, X, Copy, CheckCircle2 } from 'lucide-react';
import DashboardHeader from '../../components/DashboardHeader';
import { useCartStore } from '../../store/useCartStore';
import { notify } from '../../lib/toast';
import { createOrder, getOrderStatus, type OrderResponse } from '../../api/orderService';

// Thông tin tài khoản ngân hàng nhận tiền
const BANK = {
  id: '970418',          // BIN của BIDV trên VietQR
  accountNo: '5660536952',
  accountName: 'VO VAN THANH DAT',
  bankName: 'BIDV',
};

const EXPIRE_SECONDS = 900; // 15 phút
const POLL_INTERVAL_MS = 3000; // polling mỗi 3 giây

function buildVietQrUrl(amount: number, content: string) {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName: BANK.accountName,
  });
  return `https://img.vietqr.io/image/${BANK.id}-${BANK.accountNo}-compact2.png?${params}`;
}

export default function CheckoutPage() {
  const { items, removeFromCart, clearCart, getTotal } = useCartStore();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [countdown, setCountdown] = useState(EXPIRE_SECONDS);
  const [copied, setCopied] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handlePaymentResult = useCallback((status: 'success' | 'expired' | 'cancelled', orderId: string) => {
    stopPolling();
    setShowModal(false);
    if (status === 'success') clearCart();
    navigate(`/payment-result?status=${status}&orderId=${orderId}`);
  }, [stopPolling, clearCart, navigate]);

  // Bắt đầu polling status sau khi order được tạo
  const startPolling = useCallback((createdOrder: OrderResponse) => {
    const expiresAt = new Date(createdOrder.expiresAt).getTime();

    // Đếm ngược thời gian hết hạn
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        handlePaymentResult('expired', createdOrder.id);
      }
    }, 1000);

    // Polling trạng thái đơn hàng
    pollRef.current = setInterval(async () => {
      try {
        const updated = await getOrderStatus(createdOrder.id);
        if (updated.status === 'PAID') {
          handlePaymentResult('success', createdOrder.id);
        } else if (updated.status === 'EXPIRED' || updated.status === 'CANCELLED') {
          handlePaymentResult('expired', createdOrder.id);
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời, tiếp tục polling
      }
    }, POLL_INTERVAL_MS);
  }, [handlePaymentResult]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleCheckout = async () => {
    if (items.length === 0) { notify.error('Giỏ hàng của bạn đang trống!'); return; }

    setIsCreating(true);
    try {
      const courseIds = items.map(i => i.id);
      const created = await createOrder(courseIds);
      setOrder(created);
      setCountdown(EXPIRE_SECONDS);
      setShowModal(true);
      startPolling(created);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Không thể tạo đơn hàng. Vui lòng thử lại.';
      notify.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    handlePaymentResult('cancelled', order?.id ?? '');
  };

  const copyRef = async () => {
    if (!order) return;
    await navigator.clipboard.writeText(order.paymentRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAmount = getTotal();
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const countdownText = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <DashboardHeader />

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 md:px-10 py-10">
        <Link to="/courses" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Tiếp tục tìm khóa học
        </Link>

        <h1 className="text-3xl font-extrabold text-on-surface mb-8">Giỏ Hàng Của Bạn</h1>

        {items.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/30">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant">
              <CartIcon className="w-10 h-10 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Giỏ hàng trống</h2>
            <p className="text-on-surface-variant mb-6">Bạn chưa chọn khóa học nào. Hãy khám phá nhé!</p>
            <Link to="/courses" className="inline-flex px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Khám Phá Khóa Học
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Danh sách khóa học */}
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
                    <div className="text-primary font-extrabold text-xl">{item.priceVnd.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Ô thanh toán */}
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

                {/* VietQR badge */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-outline-variant/40 bg-surface-container mb-8">
                  <div className="w-10 h-10 rounded-lg bg-[#d92b3a] flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-on-surface text-sm">Chuyển khoản VietQR</div>
                    <div className="text-on-surface-variant text-xs">Quét QR bằng app ngân hàng bất kỳ</div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCreating}
                  className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                  {isCreating ? 'Đang tạo đơn hàng...' : 'Tạo Mã QR Thanh Toán'}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Bảo mật qua VietQR — không lưu thông tin thẻ
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal QR thanh toán */}
      <AnimatePresence>
        {showModal && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-[#d92b3a] p-4 text-white font-bold flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  <span>Thanh toán qua VietQR</span>
                </div>
                <button onClick={handleCancel} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center">
                {/* QR Code */}
                <div className="w-52 h-52 bg-white p-2 rounded-2xl shadow-sm border border-outline-variant/30 mb-5">
                  <img
                    src={buildVietQrUrl(order.totalAmount, order.paymentRef)}
                    alt="VietQR"
                    className="w-full h-full"
                    onError={e => { (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${order.paymentRef}`; }}
                  />
                </div>

                {/* Thông tin chuyển khoản */}
                <div className="w-full bg-surface-container rounded-2xl p-4 space-y-3 mb-4 text-sm">
                  <InfoRow label="Ngân hàng" value={BANK.bankName} />
                  <InfoRow label="Số tài khoản" value={BANK.accountNo} />
                  <InfoRow label="Chủ tài khoản" value={BANK.accountName} />
                  <InfoRow label="Số tiền" value={`${order.totalAmount.toLocaleString('vi-VN')}đ`} highlight />
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Nội dung CK:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{order.paymentRef}</span>
                      <button onClick={copyRef} className="p-1 hover:bg-surface-container-high rounded transition-colors" title="Sao chép">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Đếm ngược */}
                <div className="flex items-center gap-2 text-amber-600 font-semibold bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang chờ thanh toán... còn {countdownText}
                </div>

                <p className="text-xs text-on-surface-variant mt-3 text-center">
                  Hệ thống tự động xác nhận sau khi nhận được chuyển khoản
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-on-surface-variant">{label}:</span>
      <span className={highlight ? 'font-bold text-primary text-base' : 'font-semibold text-on-surface'}>{value}</span>
    </div>
  );
}

function CartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
