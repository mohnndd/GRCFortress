package com.grcfortress.report;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportedItemRepository extends JpaRepository<ReportedItem, Long> {
    List<ReportedItem> findAllByOrderByUpdatedAtDesc();
    List<ReportedItem> findAllByReporterUsernameIgnoreCaseOrderByUpdatedAtDesc(String reporterUsername);
}
