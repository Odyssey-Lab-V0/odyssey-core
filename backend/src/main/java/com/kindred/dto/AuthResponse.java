package com.kindred.dto;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record AuthResponse(String token, UserResponse user) {}
