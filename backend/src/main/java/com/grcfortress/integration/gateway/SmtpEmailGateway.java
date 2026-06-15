package com.grcfortress.integration.gateway;

import java.util.Map;
import java.util.Properties;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

/**
 * Generic SMTP email gateway, configured entirely from admin-supplied
 * settings (host, port, username/password, TLS, from address).
 */
@Component
public class SmtpEmailGateway implements EmailGateway {

    @Override
    public String providerKey() {
        return "SMTP";
    }

    @Override
    public void send(Map<String, String> settings, String to, String subject, String body) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(settings.get("host"));
        mailSender.setPort(Integer.parseInt(settings.getOrDefault("port", "587")));

        String username = settings.get("username");
        if (username != null && !username.isBlank()) {
            mailSender.setUsername(username);
            mailSender.setPassword(settings.get("password"));
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", username != null && !username.isBlank());
        props.put("mail.smtp.starttls.enable", Boolean.parseBoolean(settings.getOrDefault("starttls", "true")));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(settings.getOrDefault("fromAddress", username));
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
