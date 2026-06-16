package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PolicyApprovalStepRepository extends JpaRepository<PolicyApprovalStep, Long> {
    List<PolicyApprovalStep> findByCycleIdOrderByStepOrderAsc(Long cycleId);

    @Query("""
            SELECT s FROM PolicyApprovalStep s
            JOIN FETCH s.cycle c
            JOIN FETCH c.policyVersion v
            JOIN FETCH v.policy p
            JOIN FETCH s.department d
            WHERE s.status = 'ACTIVE'
            ORDER BY s.activatedAt ASC NULLS LAST
            """)
    List<PolicyApprovalStep> findAllActive();
}
