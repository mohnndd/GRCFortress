package com.grcfortress.observation;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ObservationMessageRepository extends JpaRepository<ObservationMessage, Long> {

    List<ObservationMessage> findAllByObservationIdOrderByCreatedAtAsc(Long observationId);
}
