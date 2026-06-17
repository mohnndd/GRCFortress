package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PolicyAcknowledgementRepository extends JpaRepository<PolicyAcknowledgement, Long> {

    List<PolicyAcknowledgement> findAllByPolicyIdOrderByAcknowledgedAtDesc(Long policyId);

    Optional<PolicyAcknowledgement> findByPolicyIdAndUsername(Long policyId, String username);

    boolean existsByPolicyIdAndUsername(Long policyId, String username);

    long countByPolicyId(Long policyId);
}
