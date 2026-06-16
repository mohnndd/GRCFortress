package com.grcfortress.risk;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskRecordRepository extends JpaRepository<RiskRecord, Long> {
    List<RiskRecord> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
