package com.grcfortress.faq;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FaqRepository extends JpaRepository<FaqPage, Long> {
    List<FaqPage> findAllByIsPublishedTrueOrderBySortOrderAsc();
    List<FaqPage> findAllByOrderBySortOrderAsc();
    Optional<FaqPage> findBySlug(String slug);
}
