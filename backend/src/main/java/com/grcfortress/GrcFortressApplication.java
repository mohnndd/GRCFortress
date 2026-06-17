package com.grcfortress;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.grcfortress.auth.JwtProperties;
import com.grcfortress.auth.MfaProperties;
import com.grcfortress.config.CompanyProperties;
import com.grcfortress.config.DefaultAdminProperties;
import com.grcfortress.config.EncryptionProperties;
import com.grcfortress.config.LockoutProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({JwtProperties.class, MfaProperties.class, DefaultAdminProperties.class, EncryptionProperties.class, CompanyProperties.class, LockoutProperties.class})
public class GrcFortressApplication {

	public static void main(String[] args) {
		SpringApplication.run(GrcFortressApplication.class, args);
	}

}
