package com.grcfortress.incident;

import com.grcfortress.department.Department;
import com.grcfortress.department.DepartmentRepository;
import com.grcfortress.incident.dto.IncidentDetail;
import com.grcfortress.incident.dto.IncidentSummary;
import com.grcfortress.incident.dto.IncidentUpdateDto;
import com.grcfortress.observation.Observation;
import com.grcfortress.observation.ObservationRepository;
import com.grcfortress.observation.ObservationStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentUpdateRepository updateRepository;
    private final IncidentFileService fileService;
    private final DepartmentRepository departmentRepository;
    private final ObservationRepository observationRepository;

    public IncidentService(
            IncidentRepository incidentRepository,
            IncidentUpdateRepository updateRepository,
            IncidentFileService fileService,
            DepartmentRepository departmentRepository,
            ObservationRepository observationRepository) {
        this.incidentRepository = incidentRepository;
        this.updateRepository = updateRepository;
        this.fileService = fileService;
        this.departmentRepository = departmentRepository;
        this.observationRepository = observationRepository;
    }

    // ── Request types ──────────────────────────────────────────────────────

    public record CreateRequest(
            String title,
            String description,
            String priority,
            Long departmentId,
            String assignedTo,
            String detectedAt,
            boolean requiresRegulatoryNotification,
            String regulatoryBody,
            String notifiedAt
    ) {}

    public record UpdateRequest(
            String title,
            String description,
            String priority,
            String status,
            Long departmentId,
            String assignedTo,
            String detectedAt,
            String resolvedAt,
            boolean requiresRegulatoryNotification,
            String regulatoryBody,
            String notifiedAt
    ) {}

    public record ProgressRequest(
            String content,
            String newStatus
    ) {}

    public record RcaRequest(
            boolean rcaRequired,
            boolean rcaCompleted,
            String rcaSummary,
            boolean rcaOpensObservation
    ) {}

    // ── List ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<IncidentSummary> list() {
        return incidentRepository.findAllWithDepartment()
                .stream().map(this::toSummary).toList();
    }

    // ── Get detail ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public IncidentDetail get(Long id) {
        Incident inc = incidentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Incident not found: " + id));
        return toDetail(inc);
    }

    // ── Create ─────────────────────────────────────────────────────────────

    public IncidentSummary create(CreateRequest req, String username) {
        Incident inc = new Incident();
        inc.setIncidentNumber(generateNumber());
        inc.setTitle(req.title());
        inc.setDescription(req.description());
        inc.setPriority(req.priority() != null ? req.priority() : "P3");
        inc.setStatus("OPEN");
        inc.setReportedBy(username);
        inc.setAssignedTo(req.assignedTo());
        inc.setCreatedBy(username);
        inc.setUpdatedBy(username);

        if (req.departmentId() != null) {
            departmentRepository.findById(req.departmentId()).ifPresent(inc::setDepartment);
        }
        if (req.detectedAt() != null && !req.detectedAt().isBlank()) {
            inc.setDetectedAt(Instant.parse(req.detectedAt()));
        }
        inc.setRequiresRegulatoryNotification(req.requiresRegulatoryNotification());
        if (req.requiresRegulatoryNotification()) {
            inc.setRegulatoryBody(req.regulatoryBody());
            if (req.notifiedAt() != null && !req.notifiedAt().isBlank()) {
                inc.setNotifiedAt(Instant.parse(req.notifiedAt()));
            }
        }

        return toSummary(incidentRepository.save(inc));
    }

    // ── Update ─────────────────────────────────────────────────────────────

    public IncidentSummary update(Long id, UpdateRequest req, String username) {
        Incident inc = incidentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Incident not found: " + id));

        inc.setTitle(req.title());
        inc.setDescription(req.description());
        if (req.priority() != null) inc.setPriority(req.priority());
        if (req.status() != null) inc.setStatus(req.status());
        inc.setAssignedTo(req.assignedTo());
        inc.setUpdatedBy(username);

        if (req.departmentId() != null) {
            departmentRepository.findById(req.departmentId()).ifPresent(inc::setDepartment);
        }
        setInstant(inc, "detectedAt", req.detectedAt());
        setInstant(inc, "resolvedAt", req.resolvedAt());

        inc.setRequiresRegulatoryNotification(req.requiresRegulatoryNotification());
        inc.setRegulatoryBody(req.regulatoryBody());
        setInstant(inc, "notifiedAt", req.notifiedAt());

        return toSummary(incidentRepository.save(inc));
    }

    // ── Upload regulatory notification attachment ───────────────────────────

    public IncidentSummary uploadNotificationAttachment(Long id, MultipartFile file, String username) {
        Incident inc = incidentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Incident not found: " + id));
        String path = fileService.store(file, id);
        inc.setNotificationAttachmentPath(path);
        inc.setNotificationAttachmentName(file.getOriginalFilename());
        inc.setUpdatedBy(username);
        return toSummary(incidentRepository.save(inc));
    }

    // ── Progress update ────────────────────────────────────────────────────

    public IncidentDetail addProgress(Long id, ProgressRequest req, String username) {
        Incident inc = incidentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Incident not found: " + id));

        IncidentUpdate upd = new IncidentUpdate();
        upd.setIncident(inc);
        upd.setAuthor(username);
        upd.setContent(req.content());

        if (req.newStatus() != null && !req.newStatus().isBlank()) {
            upd.setNewStatus(req.newStatus());
            inc.setStatus(req.newStatus());
            if (req.newStatus().equals("CLOSED") || req.newStatus().equals("CONTAINED")) {
                if (inc.getResolvedAt() == null) inc.setResolvedAt(Instant.now());
            }
        }

        inc.setUpdatedBy(username);
        updateRepository.save(upd);
        incidentRepository.save(inc);

        return get(id);
    }

    // ── Admin: set RCA ─────────────────────────────────────────────────────

    public IncidentDetail setRca(Long id, RcaRequest req, String username) {
        Incident inc = incidentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Incident not found: " + id));

        inc.setRcaRequired(req.rcaRequired());
        inc.setRcaCompleted(req.rcaCompleted());
        inc.setRcaSummary(req.rcaSummary());
        inc.setRcaOpensObservation(req.rcaOpensObservation());
        inc.setUpdatedBy(username);

        // Auto-create observation when RCA is marked complete and flag is set
        if (req.rcaCompleted() && req.rcaOpensObservation() && inc.getLinkedObservation() == null) {
            Observation obs = createLinkedObservation(inc, username);
            inc.setLinkedObservation(obs);
        }

        incidentRepository.save(inc);
        return get(id);
    }

    // ── Delete ─────────────────────────────────────────────────────────────

    public void delete(Long id) {
        if (!incidentRepository.existsById(id)) {
            throw new NoSuchElementException("Incident not found: " + id);
        }
        incidentRepository.deleteById(id);
    }

    // ── Download attachment path ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public java.nio.file.Path resolveAttachment(Long id) {
        Incident inc = incidentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Incident not found: " + id));
        if (inc.getNotificationAttachmentPath() == null) {
            throw new NoSuchElementException("No attachment for incident: " + id);
        }
        return fileService.resolve(inc.getNotificationAttachmentPath());
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private String generateNumber() {
        int year = Year.now().getValue();
        Integer maxSeq = incidentRepository.findMaxSequence();
        int next = (maxSeq == null ? 0 : maxSeq) + 1;
        return "INC" + year + String.format("%04d", next);
    }

    private Observation createLinkedObservation(Incident inc, String username) {
        long count = observationRepository.count();
        String obsNumber = "OBS-" + Year.now().getValue() + "-" + String.format("%04d", count + 1);
        Department dept = inc.getDepartment();
        Observation obs = new Observation(obsNumber, "RCA follow-up: " + inc.getTitle(), dept, dept);
        obs.setDescription("Root Cause Analysis follow-up observation created from incident " + inc.getIncidentNumber());
        obs.setStatus(ObservationStatus.OPEN);
        return observationRepository.save(obs);
    }

    private void setInstant(Incident inc, String field, String value) {
        Instant instant = (value != null && !value.isBlank()) ? Instant.parse(value) : null;
        switch (field) {
            case "detectedAt" -> inc.setDetectedAt(instant);
            case "resolvedAt" -> inc.setResolvedAt(instant);
            case "notifiedAt" -> inc.setNotifiedAt(instant);
        }
    }

    private IncidentSummary toSummary(Incident inc) {
        return new IncidentSummary(
                inc.getId(),
                inc.getIncidentNumber(),
                inc.getTitle(),
                inc.getPriority(),
                inc.getStatus(),
                inc.getDepartment() != null ? inc.getDepartment().getId() : null,
                inc.getDepartment() != null ? inc.getDepartment().getName() : null,
                inc.getReportedBy(),
                inc.getAssignedTo(),
                inc.getDetectedAt(),
                inc.getResolvedAt(),
                inc.isRequiresRegulatoryNotification(),
                inc.getRegulatoryBody(),
                inc.getNotifiedAt(),
                inc.getNotificationAttachmentName(),
                inc.isRcaRequired(),
                inc.isRcaCompleted(),
                inc.isRcaOpensObservation(),
                inc.getLinkedObservation() != null ? inc.getLinkedObservation().getId() : null,
                inc.getCreatedAt(),
                inc.getCreatedBy()
        );
    }

    private IncidentDetail toDetail(Incident inc) {
        List<IncidentUpdateDto> updates = inc.getUpdates().stream()
                .map(u -> new IncidentUpdateDto(u.getId(), u.getAuthor(), u.getContent(), u.getNewStatus(), u.getCreatedAt()))
                .toList();
        return new IncidentDetail(
                inc.getId(),
                inc.getIncidentNumber(),
                inc.getTitle(),
                inc.getDescription(),
                inc.getPriority(),
                inc.getStatus(),
                inc.getDepartment() != null ? inc.getDepartment().getId() : null,
                inc.getDepartment() != null ? inc.getDepartment().getName() : null,
                inc.getReportedBy(),
                inc.getAssignedTo(),
                inc.getDetectedAt(),
                inc.getResolvedAt(),
                inc.isRequiresRegulatoryNotification(),
                inc.getRegulatoryBody(),
                inc.getNotifiedAt(),
                inc.getNotificationAttachmentName(),
                inc.isRcaRequired(),
                inc.isRcaCompleted(),
                inc.getRcaSummary(),
                inc.isRcaOpensObservation(),
                inc.getLinkedObservation() != null ? inc.getLinkedObservation().getId() : null,
                inc.getCreatedAt(),
                inc.getCreatedBy(),
                updates
        );
    }
}
