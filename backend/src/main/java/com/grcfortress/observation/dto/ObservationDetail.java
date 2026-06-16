package com.grcfortress.observation.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.grcfortress.observation.ObservationStatus;

public record ObservationDetail(
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
        String createdBy,
        String description,
        String controlViolation,
        boolean isRegulationRelated,
        String regulationFileName,
        String regulationFilePath,
        List<ObservationMessageDto> messages,
        List<ClosureRequestDto> closureRequests,
        boolean currentUserIsInCreatorDept,
        boolean currentUserIsInReceivingDept
) {}
