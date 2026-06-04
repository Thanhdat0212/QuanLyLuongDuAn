package com.beeacademy.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Cấu hình Spring Security cho toàn bộ ứng dụng.
 *
 * <p>Triết lý:
 * <ul>
 *   <li><b>Stateless</b>: backend KHÔNG dùng session - mỗi request tự mang
 *       JWT. Tắt {@code SessionCreationPolicy.STATELESS} để Spring không
 *       tạo HttpSession (tiết kiệm RAM, scale ngang dễ).</li>
 *   <li><b>Tắt CSRF</b>: vì API REST stateless + dùng Bearer token (không
 *       phải cookie session). CSRF token chỉ cần cho form-based auth.</li>
 *   <li><b>Whitelist endpoint public</b>: liệt kê tường minh các route
 *       không yêu cầu auth. Mặc định mọi route khác đều cần JWT hợp lệ.</li>
 *   <li><b>Method-level security</b>: bật {@code @EnableMethodSecurity}
 *       để dùng {@code @PreAuthorize("hasRole('admin')")} ở từng method
 *       service/controller.</li>
 * </ul>
 *
 * <p>{@link JwtAuthenticationFilter} được chèn TRƯỚC
 * {@link UsernamePasswordAuthenticationFilter} → mọi request được verify
 * JWT trước khi đến filter mặc định của Spring Security.
 */
@Configuration
@EnableMethodSecurity   // Bật @PreAuthorize, @PostAuthorize cho service/controller
public class SecurityConfig {

    /**
     * Constructor injection - rõ ràng và dễ test hơn @Autowired field.
     *
     * @param jwtFilter   filter custom verify JWT Supabase
     * @param corsSource  config CORS từ {@link CorsConfig}
     */
    private final JwtAuthenticationFilter jwtFilter;
    private final UrlBasedCorsConfigurationSource corsSource;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          UrlBasedCorsConfigurationSource corsSource) {
        this.jwtFilter = jwtFilter;
        this.corsSource = corsSource;
    }

    /**
     * Định nghĩa SecurityFilterChain - chuỗi filter mà mọi request đi qua.
     *
     * <p>Thứ tự cấu hình trong builder:
     * <ol>
     *   <li>Bật CORS với source đã định nghĩa.</li>
     *   <li>Tắt CSRF.</li>
     *   <li>Đặt session policy STATELESS.</li>
     *   <li>Khai báo authorization rules cho từng matcher.</li>
     *   <li>Chèn JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter.</li>
     * </ol>
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Bật CORS theo source đã định nghĩa ở CorsConfig
                .cors(cors -> cors.configurationSource(corsSource))

                // Tắt CSRF - vì REST stateless + JWT trong header (không cookie)
                .csrf(AbstractHttpConfigurer::disable)

                // Tắt form login / http basic - chỉ dùng JWT
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // KHÔNG tạo session - mỗi request đứng độc lập với JWT của riêng nó
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ========================================================
                // Quy tắc phân quyền theo URL
                // ========================================================
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS phải cho qua không cần auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ----- Public endpoints -----
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()

                        // ----- Teacher Portal -----
                        .requestMatchers("/api/teacher/**").authenticated()
                        .requestMatchers("/api/upload/**").authenticated()

                        // ----- Admin Portal -----
                        .requestMatchers("/api/admin/**").authenticated()

                        // ----- Student Quiz -----
                        .requestMatchers("/api/student/**").authenticated()

                        // ----- Tất cả route còn lại cần JWT hợp lệ -----
                        .anyRequest().authenticated()
                )

                // BUG FIX: Spring Security mặc định trả 403 cho cả "chưa xác thực" (401)
                // lẫn "không có quyền" (403). Cần tách biệt rõ:
                //   - AuthenticationEntryPoint: xử lý khi request KHÔNG có/sai JWT → 401 + JSON
                //   - AccessDeniedHandler: xử lý khi đã login nhưng không có quyền → 403 (mặc định)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write(
                                    "{\"success\":false,\"code\":\"UNAUTHORIZED\"," +
                                    "\"message\":\"Vui lòng đăng nhập để tiếp tục.\"}");
                        })
                )

                // Chèn filter verify JWT TRƯỚC filter username/password mặc định
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
