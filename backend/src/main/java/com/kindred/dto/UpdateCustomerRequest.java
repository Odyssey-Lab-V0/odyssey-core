package com.kindred.dto;

import io.micronaut.core.annotation.Nullable;
import io.micronaut.serde.annotation.Serdeable;

import java.time.LocalDate;

@Serdeable
public record UpdateCustomerRequest(
        @Nullable String fullName,
        @Nullable String phone,
        @Nullable String country,
        @Nullable LocalDate dateOfBirth
) {}
