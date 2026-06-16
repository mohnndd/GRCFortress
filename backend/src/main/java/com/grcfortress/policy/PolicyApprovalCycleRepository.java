package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PolicyApprovalCycleRepository extends JpaRepository<PolicyApprovalCycle, Long> {
    Optional<PolicyApprovalCycle> findByPolicyVersionId(Long policyVersionId);
}
