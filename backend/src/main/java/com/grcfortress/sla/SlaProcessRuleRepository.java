package com.grcfortress.sla;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SlaProcessRuleRepository extends JpaRepository<SlaProcessRule, Long> {
    Optional<SlaProcessRule> findByProcessType(String processType);
}
