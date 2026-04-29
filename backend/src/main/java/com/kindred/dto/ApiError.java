package com.kindred.dto;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record ApiError(String error, String message) {}
