package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyStepMessageRepository extends JpaRepository<PolicyStepMessage, Long> {
    List<PolicyStepMessage> findByStepIdOrderByCreatedAtAsc(Long stepId);
}
