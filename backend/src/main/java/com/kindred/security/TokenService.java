package com.kindred.security;

import com.kindred.domain.User;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.token.generator.TokenGenerator;
import jakarta.inject.Singleton;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Singleton
public class TokenService {

    private final TokenGenerator tokenGenerator;

    public TokenService(TokenGenerator tokenGenerator) {
        this.tokenGenerator = tokenGenerator;
    }

    public String issue(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", user.getId());
        claims.put("email", user.getEmail());
        claims.put("name", user.getFullName());
        claims.put("roles", List.of(user.getRole()));
        Authentication auth = Authentication.build(user.getId(), List.of(user.getRole()), claims);
        Optional<String> token = tokenGenerator.generateToken(auth, 7200);
        return token.orElseThrow(() -> new IllegalStateException("Failed to issue token"));
    }
}
