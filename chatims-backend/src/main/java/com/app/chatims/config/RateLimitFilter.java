package com.app.chatims.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Bandwidth AUTH_LIMIT = Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build();
    private static final Bandwidth PHOTO_LIMIT = Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build();

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String path = req.getRequestURI();
        Bandwidth limit = null;
        String key = null;

        if (path.startsWith("/auth/")) {
            limit = AUTH_LIMIT;
            key = "auth:" + clientIp(req);
        } else if (path.startsWith("/users/me/photos") && "POST".equalsIgnoreCase(req.getMethod())) {
            limit = PHOTO_LIMIT;
            key = "photos:" + clientIp(req);
        }

        if (limit != null) {
            Bandwidth bw = limit;
            Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder().addLimit(bw).build());
            if (!bucket.tryConsume(1)) {
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Too many requests, please slow down.\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    private String clientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
