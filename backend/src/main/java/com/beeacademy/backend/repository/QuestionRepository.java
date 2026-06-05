package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Truy vấn bảng {@code questions}.
 *
 * <p>Hai nhóm query chính:
 * <ul>
 *   <li>Phía giáo viên: CRUD câu hỏi + thống kê ngân hàng.</li>
 *   <li>Phía quiz service: lấy pool câu theo chapter + difficulty để randomize.</li>
 * </ul>
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    // ─── Teacher side ────────────────────────────────────────────────────────

    /** Danh sách câu hỏi của một GV, filter tùy chọn theo chapter và difficulty. */
    Page<Question> findByTeacherIdAndChapterIdAndDifficultyAndStatus(
            UUID teacherId, UUID chapterId, String difficulty, String status, Pageable pageable);

    /** Chỉ filter theo teacher + chapter (bỏ qua difficulty). */
    Page<Question> findByTeacherIdAndChapterIdAndStatus(
            UUID teacherId, UUID chapterId, String status, Pageable pageable);

    /** Chỉ filter theo teacher + difficulty (bỏ qua chapter). */
    Page<Question> findByTeacherIdAndDifficultyAndStatus(
            UUID teacherId, String difficulty, String status, Pageable pageable);

    /** Tất cả câu của teacher có status. */
    Page<Question> findByTeacherIdAndStatus(UUID teacherId, String status, Pageable pageable);

    // ─── Quiz side ───────────────────────────────────────────────────────────

    /**
     * Lấy pool câu theo chapter + difficulty + status=active để randomize.
     * Không phân trang — lấy hết rồi shuffle trong Java.
     */
    @Query("SELECT q FROM Question q WHERE q.chapter.id = :chapterId " +
           "AND q.difficulty = :difficulty AND q.status = 'active'")
    List<Question> findActiveByChapterAndDifficulty(
            @Param("chapterId") UUID chapterId,
            @Param("difficulty") String difficulty);

    // ─── Stats ───────────────────────────────────────────────────────────────

    /**
     * Đếm số câu active theo chapter và difficulty.
     * Dùng để hiển thị "Ngân hàng có X câu Dễ / Y câu Trung bình / Z câu Khó".
     */
    @Query("SELECT q.difficulty, COUNT(q) FROM Question q " +
           "WHERE q.chapter.id = :chapterId AND q.status = 'active' " +
           "GROUP BY q.difficulty")
    List<Object[]> countActiveByDifficultyForChapter(@Param("chapterId") UUID chapterId);

    // ─── Batch update usageCount ─────────────────────────────────────────────

    /**
     * Tăng usage_count cho nhiều câu cùng lúc sau khi student nộp bài.
     * Dùng batch UPDATE thay vì N lần save() riêng lẻ.
     */
    @Modifying
    @Query("UPDATE Question q SET q.usageCount = q.usageCount + 1 WHERE q.id IN :ids")
    void incrementUsageCount(@Param("ids") List<UUID> ids);
}
