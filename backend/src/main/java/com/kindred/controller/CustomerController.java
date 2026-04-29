package com.kindred.controller;

import com.kindred.domain.User;
import com.kindred.dto.ApiError;
import com.kindred.dto.UpdateCustomerRequest;
import com.kindred.dto.UserResponse;
import com.kindred.repo.UserRepository;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.*;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Controller("/api/customers")
@Secured(SecurityRule.IS_AUTHENTICATED)
public class CustomerController {

    private final UserRepository users;

    public CustomerController(UserRepository users) {
        this.users = users;
    }

    @Get(produces = MediaType.APPLICATION_JSON)
    @Secured("ADMIN")
    public List<UserResponse> list() {
        return ((List<User>) users.findAll()).stream().map(UserResponse::of).toList();
    }

    @Get(value = "/{id}", produces = MediaType.APPLICATION_JSON)
    public HttpResponse<?> get(String id, Authentication auth) {
        if (!isAdminOrSelf(auth, id)) {
            return HttpResponse.status(HttpStatus.FORBIDDEN)
                    .body(new ApiError("forbidden", "You may only access your own profile."));
        }
        Optional<User> uo = users.findById(id);
        if (uo.isEmpty()) {
            return HttpResponse.status(HttpStatus.NOT_FOUND)
                    .body(new ApiError("not_found", "Customer not found."));
        }
        return HttpResponse.ok(UserResponse.of(uo.get()));
    }

    @Patch(value = "/{id}", consumes = MediaType.APPLICATION_JSON, produces = MediaType.APPLICATION_JSON)
    @Transactional
    public HttpResponse<?> update(String id, @Valid @Body UpdateCustomerRequest req, Authentication auth) {
        if (!isAdminOrSelf(auth, id)) {
            return HttpResponse.status(HttpStatus.FORBIDDEN)
                    .body(new ApiError("forbidden", "You may only update your own profile."));
        }
        Optional<User> uo = users.findById(id);
        if (uo.isEmpty()) {
            return HttpResponse.status(HttpStatus.NOT_FOUND)
                    .body(new ApiError("not_found", "Customer not found."));
        }
        User u = uo.get();
        if (req.fullName() != null) u.setFullName(req.fullName().trim());
        if (req.phone() != null) u.setPhone(req.phone());
        if (req.country() != null) u.setCountry(req.country());
        if (req.dateOfBirth() != null) u.setDateOfBirth(req.dateOfBirth());
        u.setUpdatedAt(Instant.now());
        users.update(u);
        return HttpResponse.ok(UserResponse.of(u));
    }

    private boolean isAdminOrSelf(Authentication auth, String id) {
        if (auth == null) return false;
        if (auth.getRoles().contains("ADMIN")) return true;
        return id.equals(auth.getName());
    }
}
