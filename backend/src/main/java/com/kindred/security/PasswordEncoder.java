package com.kindred.security;

import at.favre.lib.crypto.bcrypt.BCrypt;
import jakarta.inject.Singleton;

@Singleton
public class PasswordEncoder {

    public String hash(String raw) {
        return BCrypt.withDefaults().hashToString(12, raw.toCharArray());
    }

    public boolean matches(String raw, String hash) {
        if (raw == null || hash == null) return false;
        return BCrypt.verifyer().verify(raw.toCharArray(), hash).verified;
    }
}
