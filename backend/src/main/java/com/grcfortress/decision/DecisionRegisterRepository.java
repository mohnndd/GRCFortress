package com.grcfortress.decision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DecisionRegisterRepository extends JpaRepository<DecisionRegister, Long> {

    List<DecisionRegister> findAllByOrderByDecisionDateDescIdDesc();

    boolean existsByDecisionNumberIgnoreCase(String decisionNumber);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(d.decisionNumber, 10) AS int)), 0) " +
           "FROM DecisionRegister d WHERE d.decisionNumber LIKE CONCAT('DEC-', :year, '-%')")
    int findMaxSequenceForYear(int year);

    Optional<DecisionRegister> findByDecisionNumberIgnoreCase(String decisionNumber);
}
