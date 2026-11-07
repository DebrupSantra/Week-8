package com.taskmanager.realtime;

import com.taskmanager.service.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StompAuthenticationInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public StompAuthenticationInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (accessor.getCommand() == StompCommand.CONNECT) {
            authenticate(accessor, message);
        } else if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
            if (accessor.getUser() == null
                    || !"/user/queue/tasks".equals(accessor.getDestination())) {
                throw new MessageDeliveryException(message,
                        "Only authenticated task notification subscriptions are allowed.");
            }
        } else if (accessor.getCommand() == StompCommand.SEND) {
            throw new MessageDeliveryException(message,
                    "Client-originated messages are not supported.");
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor, Message<?> message) {
        String authorization = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new MessageDeliveryException("A bearer access token is required.");
        }
        String token = authorization.substring(7).trim();
        try {
            String email = jwtService.extractSubject(token);
            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    email, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        } catch (JwtException | IllegalArgumentException exception) {
            throw new MessageDeliveryException(message, exception);
        }
    }
}
