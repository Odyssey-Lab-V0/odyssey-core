package com.kindred.init;

import com.kindred.domain.User;
import com.kindred.repo.UserRepository;
import com.kindred.security.PasswordEncoder;
import io.micronaut.context.annotation.Value;
import io.micronaut.context.event.ApplicationEventListener;
import io.micronaut.runtime.event.annotation.EventListener;
import io.micronaut.runtime.server.event.ServerStartupEvent;
import jakarta.inject.Singleton;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class AdminSeeder {

    private static final Logger LOG = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminSeeder(UserRepository users,
                       PasswordEncoder encoder,
                       @Value("${app.admin.email}") String adminEmail,
                       @Value("${app.admin.password}") String adminPassword) {
        this.users = users;
        this.encoder = encoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @EventListener
    @Transactional
    public void onStartup(ServerStartupEvent event) {
        String email = adminEmail.trim().toLowerCase();
        if (users.existsByEmail(email)) {
            LOG.info("Admin user already present: {}", email);
            return;
        }
        User admin = new User();
        admin.setFullName("Kindred Admin");
        admin.setEmail(email);
        admin.setPasswordHash(encoder.hash(adminPassword));
        admin.setRole("ADMIN");
        users.save(admin);
        LOG.info("Seeded ADMIN user: {}", email);
    }
}
