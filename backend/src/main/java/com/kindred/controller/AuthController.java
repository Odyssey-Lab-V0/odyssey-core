package com.kindred.controller;

import com.kindred.domain.User;
import com.kindred.dto.*;
import com.kindred.repo.UserRepository;
import com.kindred.security.PasswordEncoder;
import com.kindred.security.TokenService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.rules.SecurityRule;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import java.time.Instant;
import java.util.Optional;

@Controller("/api/auth")
@Secured(SecurityRule.IS_ANONYMOUS)
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    public AuthController(UserRepository users, PasswordEncoder encoder, TokenService tokens) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    @Post(value = "/signup", consumes = MediaType.APPLICATION_JSON, produces = MediaType.APPLICATION_JSON)
    @Transactional
    public HttpResponse<?> signup(@Valid @Body SignupRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            return HttpResponse.status(HttpStatus.CONFLICT)
                    .body(new ApiError("email_taken", "An account with this email already exists."));
        }
        User u = new User();
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.hash(req.password()));
        u.setPhone(req.phone());
        u.setCountry(req.country());
        u.setDateOfBirth(req.dateOfBirth());
        u.setRole("CUSTOMER");
        users.save(u);
        return HttpResponse.created(new AuthResponse(tokens.issue(u), UserResponse.of(u)));
    }

    @Post(value = "/login", consumes = MediaType.APPLICATION_JSON, produces = MediaType.APPLICATION_JSON)
    public HttpResponse<?> login(@Valid @Body LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        Optional<User> uo = users.findByEmail(email);
        if (uo.isEmpty() || !encoder.matches(req.password(), uo.get().getPasswordHash())) {
            return HttpResponse.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiError("invalid_credentials", "Invalid email or password."));
        }
        User u = uo.get();
        u.setUpdatedAt(Instant.now());
        users.update(u);
        return HttpResponse.ok(new AuthResponse(tokens.issue(u), UserResponse.of(u)));
    }
}
