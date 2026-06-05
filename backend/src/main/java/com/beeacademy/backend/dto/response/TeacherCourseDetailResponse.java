package com.beeacademy.backend.dto.response;

import com.beeacademy.backend.model.ApprovalHistory;
import com.beeacademy.backend.model.Course;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Chi tiết khóa học đầy đủ phía GV — kèm chapters, lessons và lịch sử duyệt.
 * Dùng cho trang chỉnh sửa /teacher/courses/:id.
 */
public record TeacherCourseDetailResponse(
        UUID id,
        String slug,
        String title,
        String description,
        String thumbnailUrl,
        UUID categoryId,
        String categoryName,
        List<Integer> grades,
        Integer priceVnd,
        Integer salePriceVnd,
        String status,
        Integer totalChapters,
        Integer totalLessons,
        Instant createdAt,
        List<TeacherChapterResponse> chapters,
        List<ApprovalHistoryResponse> approvalHistory
) {
    public static TeacherCourseDetailResponse fromEntity(Course c,
                                                          List<ApprovalHistory> history) {
        List<TeacherChapterResponse> chapters = c.getChapters().stream()
                .map(TeacherChapterResponse::fromEntity)
                .toList();
        List<ApprovalHistoryResponse> historyDtos = history.stream()
                .map(ApprovalHistoryResponse::fromEntity)
                .toList();
        return new TeacherCourseDetailResponse(
                c.getId(), c.getSlug(), c.getTitle(), c.getDescription(),
                c.getThumbnailUrl(),
                c.getCategory() != null ? c.getCategory().getId() : null,
                c.getCategory() != null ? c.getCategory().getName() : null,
                Arrays.stream(c.getGrades()).boxed().collect(Collectors.toList()),
                c.getPriceVnd(), c.getSalePriceVnd(),
                c.getStatus().toDbValue(),
                c.getTotalChapters(), c.getTotalLessons(),
                c.getCreatedAt(), chapters, historyDtos
        );
    }
}
