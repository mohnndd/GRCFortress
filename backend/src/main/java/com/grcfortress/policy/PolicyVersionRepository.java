package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PolicyVersionRepository extends JpaRepository<PolicyVersion, Long> {
    List<PolicyVersion> findAllByPolicyIdOrderByCreatedAtDesc(Long policyId);
    Optional<PolicyVersion> findTopByPolicyIdOrderByCreatedAtDesc(Long policyId);
    long countByPolicyId(Long policyId);
}
