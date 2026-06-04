package com.app.chatims.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthChannelInterceptor.class);

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);
            if (token == null) {
                log.warn("STOMP CONNECT rejected: missing Authorization header");
                throw new IllegalArgumentException("Missing JWT");
            }
            try {
                Jwt jwt = jwtDecoder.decode(token);
                AbstractAuthenticationToken auth = jwtAuthenticationConverter.convert(jwt);
                accessor.setUser(auth);
                log.info("STOMP CONNECT: sub={} principalName={}",
                        jwt.getSubject(), auth != null ? auth.getName() : "null");
            } catch (JwtException e) {
                log.warn("STOMP CONNECT rejected: invalid JWT — {}", e.getMessage());
                throw new IllegalArgumentException("Invalid JWT");
            }
        }
        return message;
    }

    private static String extractToken(StompHeaderAccessor accessor) {
        List<String> values = accessor.getNativeHeader("Authorization");
        if (values == null || values.isEmpty()) {
            values = accessor.getNativeHeader("authorization");
        }
        if (values == null || values.isEmpty()) return null;
        String header = values.get(0);
        if (header == null) return null;
        if (header.startsWith("Bearer ")) return header.substring(7);
        return header;
    }
}
