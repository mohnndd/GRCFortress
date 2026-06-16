package com.grcfortress.policy;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyVersionFileRepository extends JpaRepository<PolicyVersionFile, Long> {
    List<PolicyVersionFile> findAllByVersionIdOrderBySortOrderAsc(Long versionId);
}
