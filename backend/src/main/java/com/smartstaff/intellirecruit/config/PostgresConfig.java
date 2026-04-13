package com.smartstaff.intellirecruit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PostgresConfig {
    @Value("${DB_URL}")
    private String dbUrl;

    @Value("${DB_USERNAME}")
    private String username;

    @Value("${DB_PASSWORD}")
    private String password;
}
