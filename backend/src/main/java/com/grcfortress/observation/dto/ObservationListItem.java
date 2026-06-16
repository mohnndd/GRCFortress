package com.grcfortress.observation.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.grcfortress.observation.ObservationStatus;

public record ObservationListItem(
        Long id,
        String observationNumber,
        String name,
        ObservationStatus status,
        String creatorDepartmentName,
        String receivingDepartmentName,
        LocalDate proposedTargetDate,
        LocalDate confirmedTargetDate,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {}
