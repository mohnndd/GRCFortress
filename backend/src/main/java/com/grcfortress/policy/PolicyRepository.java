package com.grcfortress.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyRepository extends JpaRepository<Policy, Long> {
    List<Policy> findAllByDocumentTypeOrderByUpdatedAtDesc(DocumentType documentType);
    List<Policy> findAllByOrderByUpdatedAtDesc();
    long countByStatus(PolicyStatus status);
    long countByDocumentType(DocumentType documentType);
}
