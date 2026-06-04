// ═══════════════════════════════════════════════════════════════════════════════
// TRANG TIN NHẮN — MessagesPage.tsx
//
// VỊ TRÍ TRONG HỆ THỐNG:
//   URL: /messages
//   Người dùng đến từ: Avatar dropdown header (click "Tin nhắn")
//
// NỘI DUNG TRANG:
//   1. Tiêu đề + nút "+ Soạn" góc trên phải → mở ComposeModal
//   2. Danh sách tin nhắn (placeholder — chưa có backend)
//
// COMPOSE MODAL:
//   Tiêu đề "Tin nhắn mới"
//   Field "Đến" (người nhận) — placeholder "Thành Đạt Academy"
//   Textarea nội dung — 5 dòng
//   Nút Cancel (không nền) + nút Gửi (nền xám đậm, chữ trắng, icon mũi tên)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine, Send, X, MessageSquare } from 'lucide-react';
import DashboardHeader from '../../components/DashboardHeader';
import PageBanner from '../../components/PageBanner';
import { notify } from '../../lib/toast';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ComposeModal
//
// Popup soạn tin nhắn mới.
// PROPS:
//   onClose — callback đóng popup
// STATE:
//   to      — người nhận (input text)
//   message — nội dung tin nhắn (textarea)
// HÀNH VI:
//   Cancel / click overlay ngoài → onClose()
//   Gửi → validate message, toast success, onClose()
// ═══════════════════════════════════════════════════════════════════════════════
interface ComposeModalProps {
  onClose: () => void;
}

function ComposeModal({ onClose }: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');

  // Mock gửi — thực tế sẽ gọi API POST /messages
  function handleSend() {
    if (!message.trim()) {
      notify.error('Vui lòng nhập nội dung tin nhắn');
      return;
    }
    notify.success('Tin nhắn đã được gửi thành công!');
    onClose();
  }

  return (
    // Overlay toàn màn hình — click ra ngoài đóng popup
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Popup card — stopPropagation để click bên trong không đóng modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl shadow-black/15 overflow-hidden border border-outline-variant/20"
      >
        {/* ── Header popup ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <h3 className="font-bold text-on-surface text-base">Tin nhắn mới</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Form ───────────────────────────────────────────────────────────── */}
        <div className="p-5 space-y-4">

          {/* Field "Đến" — người nhận */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Đến
            </label>
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="Thành Đạt Academy"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-all"
            />
          </div>

          {/* Textarea nội dung — rows=5 ≈ 5 dòng chiều cao */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Nội dung
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Nhập nội dung tin nhắn của bạn..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* ── Hàng nút ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-outline-variant/20">
          {/* Cancel — không nền, chỉ text */}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
          >
            Cancel
          </button>

          {/* Gửi — nền xám đậm, chữ trắng, icon mũi tên gửi */}
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-700 active:bg-gray-900 transition-colors"
          >
            Gửi
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  // showCompose=true → render ComposeModal
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <DashboardHeader />

      <PageBanner
        title="Tin nhắn"
        subtitle="Trao đổi với giảng viên và Academy"
      />

      {/* Nội dung full-width */}
      <div className="flex-grow max-w-[1600px] mx-auto w-full px-4 md:px-10 py-8">
        <main>

          {/* Tiêu đề + nút Soạn */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Hộp thư</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Tin nhắn với giảng viên và đội ngũ Bee Academy
              </p>
            </div>

            {/* Nút "+ Soạn" — nền trắng, border nhẹ */}
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-sm"
            >
              <PenLine className="w-4 h-4" />
              + Soạn
            </button>
          </div>

          {/* Placeholder danh sách tin nhắn — chưa có backend */}
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 border-dashed">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-5">
              <MessageSquare className="w-9 h-9 text-on-surface-variant opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Chưa có tin nhắn nào</h3>
            <p className="text-on-surface-variant text-sm text-center max-w-sm mb-6">
              Nhấn <span className="font-semibold text-on-surface">+ Soạn</span> để bắt đầu cuộc trò chuyện với Bee Academy.
            </p>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <PenLine className="w-4 h-4" />
              Soạn tin nhắn mới
            </button>
          </div>

        </main>
      </div>

      {/* ComposeModal — AnimatePresence xử lý animation mount/unmount */}
      <AnimatePresence>
        {showCompose && (
          <ComposeModal onClose={() => setShowCompose(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
