package com.grcfortress.risk;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskCategoryRepository extends JpaRepository<RiskCategory, Long> {
    List<RiskCategory> findAllByDomainIdOrderBySortOrderAsc(Long domainId);
}
