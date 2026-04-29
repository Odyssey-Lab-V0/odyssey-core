package com.kindred.dto;

import io.micronaut.core.annotation.Nullable;
import io.micronaut.serde.annotation.Serdeable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Serdeable
public record SignupRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @Nullable String phone,
        @Nullable String country,
        @Nullable LocalDate dateOfBirth
) {}
