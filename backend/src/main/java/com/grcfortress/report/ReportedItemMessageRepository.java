package com.grcfortress.report;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportedItemMessageRepository extends JpaRepository<ReportedItemMessage, Long> {
    List<ReportedItemMessage> findAllByReportedItem_IdOrderByCreatedAtAsc(Long reportedItemId);
}
