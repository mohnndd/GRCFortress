package com.grcfortress.delegation;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthorityDelegationRepository extends JpaRepository<AuthorityDelegation, Long> {

    List<AuthorityDelegation> findAllByDelegatorUsernameOrderByCreatedAtDesc(String delegatorUsername);

    List<AuthorityDelegation> findAllByDelegateUsernameOrderByCreatedAtDesc(String delegateUsername);

    @Query("""
           SELECT COUNT(d) > 0 FROM AuthorityDelegation d
           WHERE d.delegatorUsername = :delegator
             AND d.delegateUsername  = :delegate
             AND d.isActive = true
             AND d.validFrom <= :today
             AND (d.validUntil IS NULL OR d.validUntil >= :today)
           """)
    boolean existsActiveByDelegatorAndDelegate(@Param("delegator") String delegator,
                                               @Param("delegate") String delegate,
                                               @Param("today") LocalDate today);
}
