package com.grcfortress.incident.dto;

import java.time.Instant;
import java.util.List;

public record IncidentDetail(
        Long id,
        String incidentNumber,
        String title,
        String description,
        String priority,
        String status,
        Long departmentId,
        String departmentName,
        String reportedBy,
        String assignedTo,
        Instant detectedAt,
        Instant resolvedAt,
        boolean requiresRegulatoryNotification,
        String regulatoryBody,
        Instant notifiedAt,
        String notificationAttachmentName,
        boolean rcaRequired,
        boolean rcaCompleted,
        String rcaSummary,
        boolean rcaOpensObservation,
        Long linkedObservationId,
        Instant createdAt,
        String createdBy,
        List<IncidentUpdateDto> updates
) {}
