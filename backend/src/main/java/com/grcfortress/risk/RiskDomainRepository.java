package com.grcfortress.risk;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RiskDomainRepository extends JpaRepository<RiskDomain, Long> {

    @Query("SELECT DISTINCT d FROM RiskDomain d LEFT JOIN FETCH d.categories ORDER BY d.sortOrder ASC")
    List<RiskDomain> findAllByOrderBySortOrderAsc();
}
