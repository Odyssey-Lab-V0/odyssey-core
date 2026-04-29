package com.kindred.controller;

import com.kindred.domain.User;
import com.kindred.dto.ApiError;
import com.kindred.dto.UserResponse;
import com.kindred.repo.UserRepository;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;

import java.util.Optional;

@Controller("/api")
public class MeController {

    private final UserRepository users;

    public MeController(UserRepository users) {
        this.users = users;
    }

    @Get(value = "/me", produces = MediaType.APPLICATION_JSON)
    @Secured(SecurityRule.IS_AUTHENTICATED)
    public HttpResponse<?> me(Authentication auth) {
        Optional<User> uo = users.findById(auth.getName());
        if (uo.isEmpty()) {
            return HttpResponse.status(io.micronaut.http.HttpStatus.UNAUTHORIZED)
                    .body(new ApiError("unknown_user", "User not found for token."));
        }
        return HttpResponse.ok(UserResponse.of(uo.get()));
    }

    @Get(value = "/health", produces = MediaType.APPLICATION_JSON)
    @Secured(SecurityRule.IS_ANONYMOUS)
    public HttpResponse<?> health() {
        return HttpResponse.ok(java.util.Map.of("status", "ok"));
    }
}
