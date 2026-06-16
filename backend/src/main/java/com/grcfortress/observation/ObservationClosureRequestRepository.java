package com.grcfortress.observation;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ObservationClosureRequestRepository extends JpaRepository<ObservationClosureRequest, Long> {

    List<ObservationClosureRequest> findAllByObservationIdOrderBySubmittedAtDesc(Long observationId);

    Optional<ObservationClosureRequest> findTopByObservationIdAndStatusOrderBySubmittedAtDesc(
            Long observationId, String status);
}
