package com.grcfortress.risk;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskDomainRepository extends JpaRepository<RiskDomain, Long> {
    List<RiskDomain> findAllByOrderBySortOrderAsc();
}
