package com.beeacademy.backend.repository;

import com.beeacademy.backend.model.Profile;
import com.beeacademy.backend.model.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn bảng {@code public.profiles}.
 *
 * <p>Kế thừa {@link JpaRepository} đã cung cấp sẵn:
 * <ul>
 *   <li>{@code save(profile)} - INSERT hoặc UPDATE</li>
 *   <li>{@code findById(uuid)} - trả về Optional</li>
 *   <li>{@code existsById(uuid)} - check sự tồn tại không load entity</li>
 *   <li>{@code deleteById(uuid)}</li>
 * </ul>
 *
 * <p>Hiện tại chưa cần custom query - sẽ thêm khi service cần truy vấn
 * theo điều kiện đặc biệt (vd: {@code findByRole}).
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    /**
     * Kiểm tra xem email có tồn tại trong bảng auth.users của Supabase không.
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = :email)", nativeQuery = true)
    boolean existsByEmailInAuth(@Param("email") String email);

    /**
     * Lấy UUID của user từ email trong bảng auth.users.
     */
    @Query(value = "SELECT id FROM auth.users WHERE email = :email", nativeQuery = true)
    Optional<UUID> findUserIdByEmail(@Param("email") String email);

    /**
     * Admin: danh sách user với tìm kiếm và filter role.
     * Join auth.users để lấy email.
     */
    @Query(value = """
        SELECT p.id, p.full_name, p.avatar_url, CAST(p.role AS TEXT), p.is_blocked, p.created_at,
               u.email
        FROM profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE (:role IS NULL OR CAST(p.role AS TEXT) = :role)
          AND (:search IS NULL OR LOWER(p.full_name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY p.created_at DESC
        """,
        countQuery = """
        SELECT COUNT(*)
        FROM profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE (:role IS NULL OR CAST(p.role AS TEXT) = :role)
          AND (:search IS NULL OR LOWER(p.full_name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
        """,
        nativeQuery = true)
    Page<Object[]> findAllWithEmail(@Param("role") String role,
                                    @Param("search") String search,
                                    Pageable pageable);

    long countByRole(UserRole role);
}
