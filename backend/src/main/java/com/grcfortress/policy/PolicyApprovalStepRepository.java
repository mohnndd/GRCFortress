package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyApprovalStepRepository extends JpaRepository<PolicyApprovalStep, Long> {
    List<PolicyApprovalStep> findByCycleIdOrderByStepOrderAsc(Long cycleId);
}
