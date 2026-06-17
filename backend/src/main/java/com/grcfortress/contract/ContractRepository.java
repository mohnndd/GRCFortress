package com.grcfortress.contract;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(c.contractNumber, 10) AS int)), 0) " +
           "FROM Contract c WHERE c.contractNumber LIKE CONCAT('CON-', :year, '-%')")
    int findMaxSequenceForYear(int year);
}
