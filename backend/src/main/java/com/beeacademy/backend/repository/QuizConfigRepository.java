package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.QuizConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn bảng {@code quiz_configs}.
 * UNIQUE constraint chapter_id đảm bảo findByChapterId trả tối đa 1 kết quả.
 */
@Repository
public interface QuizConfigRepository extends JpaRepository<QuizConfig, UUID> {

    Optional<QuizConfig> findByChapterId(UUID chapterId);

    boolean existsByChapterId(UUID chapterId);
}
