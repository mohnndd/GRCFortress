package com.grcfortress.integration;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IntegrationSettingRepository extends JpaRepository<IntegrationSetting, Long> {

    Optional<IntegrationSetting> findByType(IntegrationType type);
}
