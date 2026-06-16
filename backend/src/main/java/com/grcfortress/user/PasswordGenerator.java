package com.grcfortress.user;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

/** Generates high-entropy temporary passwords for admin-issued accounts/resets. */
@Component
public class PasswordGenerator {

    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnpqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "!@#$%^&*-_+=";
    private static final String ALL = UPPER + LOWER + DIGITS + SYMBOLS;
    private static final int LENGTH = 16;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generate() {
        char[] password = new char[LENGTH];
        password[0] = UPPER.charAt(secureRandom.nextInt(UPPER.length()));
        password[1] = LOWER.charAt(secureRandom.nextInt(LOWER.length()));
        password[2] = DIGITS.charAt(secureRandom.nextInt(DIGITS.length()));
        password[3] = SYMBOLS.charAt(secureRandom.nextInt(SYMBOLS.length()));
        for (int i = 4; i < LENGTH; i++) {
            password[i] = ALL.charAt(secureRandom.nextInt(ALL.length()));
        }
        for (int i = password.length - 1; i > 0; i--) {
            int j = secureRandom.nextInt(i + 1);
            char tmp = password[i];
            password[i] = password[j];
            password[j] = tmp;
        }
        return new String(password);
    }
}
