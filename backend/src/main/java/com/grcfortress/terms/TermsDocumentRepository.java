package com.grcfortress.terms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TermsDocumentRepository extends JpaRepository<TermsDocument, Long> {

    List<TermsDocument> findAllByOrderByUpdatedAtDesc();

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(d.documentNumber, 9) AS int)), 0) " +
           "FROM TermsDocument d WHERE d.documentNumber LIKE CONCAT('TC-', :year, '-%')")
    int findMaxSequenceForYear(int year);
}
