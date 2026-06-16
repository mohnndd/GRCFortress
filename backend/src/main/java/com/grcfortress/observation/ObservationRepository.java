package com.grcfortress.observation;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ObservationRepository extends JpaRepository<Observation, Long> {

    List<Observation> findAllByOrderByUpdatedAtDesc();

    List<Observation> findAllByCreatorDepartmentIdOrReceivingDepartmentIdOrderByUpdatedAtDesc(
            Long creatorDepartmentId, Long receivingDepartmentId);
}
