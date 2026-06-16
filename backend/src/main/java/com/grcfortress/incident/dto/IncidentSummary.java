package com.grcfortress.incident.dto;

import java.time.Instant;

public record IncidentSummary(
        Long id,
        String incidentNumber,
        String title,
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
        boolean rcaOpensObservation,
        Long linkedObservationId,
        Instant createdAt,
        String createdBy
) {}
