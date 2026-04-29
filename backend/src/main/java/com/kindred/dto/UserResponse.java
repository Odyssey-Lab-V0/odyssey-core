package com.kindred.dto;

import com.kindred.domain.User;
import io.micronaut.serde.annotation.Serdeable;

import java.time.Instant;
import java.time.LocalDate;

@Serdeable
public record UserResponse(
        String id,
        String fullName,
        String email,
        String phone,
        String country,
        LocalDate dateOfBirth,
        String role,
        Instant createdAt
) {
    public static UserResponse of(User u) {
        return new UserResponse(
                u.getId(), u.getFullName(), u.getEmail(),
                u.getPhone(), u.getCountry(), u.getDateOfBirth(),
                u.getRole(), u.getCreatedAt()
        );
    }
}
