package com.grcfortress.decision;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/decisions")
public class DecisionRegisterController {

    record DecisionDto(
            Long id,
            String decisionNumber,
            String title,
            LocalDate decisionDate,
            String decisionMaker,
            String relatedRisk,
            String relatedPolicyControl,
            String backgroundContext,
            String alternativesConsidered,
            String decisionOutcome,
            String justification,
            String impactAssessment,
            String actionsRequired,
            String owner,
            LocalDate dueDate,
            LocalDate reviewDate,
            String status,
            String attachmentName,
            String createdBy,
            java.time.Instant createdAt,
            java.time.Instant updatedAt
    ) {}

    record SaveRequest(
            String title,
            LocalDate decisionDate,
            String decisionMaker,
            String relatedRisk,
            String relatedPolicyControl,
            String backgroundContext,
            String alternativesConsidered,
            String decisionOutcome,
            String justification,
            String impactAssessment,
            String actionsRequired,
            String owner,
            LocalDate dueDate,
            LocalDate reviewDate,
            String status
    ) {}

    private final DecisionRegisterRepository repository;
    private final Path uploadRoot;

    public DecisionRegisterController(DecisionRegisterRepository repository) {
        this.repository = repository;
        this.uploadRoot = Paths.get(System.getProperty("user.home"), "grc-fortress", "uploads", "decisions");
        try { Files.createDirectories(uploadRoot); } catch (IOException ex) {
            throw new IllegalStateException("Cannot create decision upload directory", ex);
        }
    }

    @GetMapping
    public List<DecisionDto> list() {
        return repository.findAllByOrderByDecisionDateDescIdDesc().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DecisionDto> get(@PathVariable Long id) {
        return repository.findById(id).map(d -> ResponseEntity.ok(toDto(d))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<DecisionDto> create(@RequestBody SaveRequest req) {
        DecisionRegister d = new DecisionRegister();
        d.setDecisionNumber(generateNumber());
        applyRequest(d, req);
        return ResponseEntity.ok(toDto(repository.save(d)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<DecisionDto> update(@PathVariable Long id, @RequestBody SaveRequest req) {
        DecisionRegister d = repository.findById(id).orElse(null);
        if (d == null) return ResponseEntity.notFound().build();
        applyRequest(d, req);
        return ResponseEntity.ok(toDto(repository.save(d)));
    }

    @PostMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<DecisionDto> uploadAttachment(@PathVariable Long id,
                                                        @RequestParam("file") MultipartFile file) throws IOException {
        DecisionRegister d = repository.findById(id).orElse(null);
        if (d == null) return ResponseEntity.notFound().build();

        String ext = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path target = uploadRoot.resolve(String.valueOf(id)).resolve(filename);
        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        d.setAttachmentPath(id + "/" + filename);
        d.setAttachmentName(file.getOriginalFilename());
        return ResponseEntity.ok(toDto(repository.save(d)));
    }

    @GetMapping("/{id}/attachment")
    public void downloadAttachment(@PathVariable Long id, HttpServletResponse response) throws IOException {
        DecisionRegister d = repository.findById(id).orElseThrow();
        if (d.getAttachmentPath() == null) { response.setStatus(404); return; }

        Path file = uploadRoot.resolve(d.getAttachmentPath());
        response.setHeader("Content-Disposition", "attachment; filename=\"" + d.getAttachmentName() + "\"");
        response.setContentType(Files.probeContentType(file));
        Files.copy(file, response.getOutputStream());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private void applyRequest(DecisionRegister d, SaveRequest req) {
        d.setTitle(req.title());
        d.setDecisionDate(req.decisionDate());
        d.setDecisionMaker(req.decisionMaker());
        d.setRelatedRisk(req.relatedRisk());
        d.setRelatedPolicyControl(req.relatedPolicyControl());
        d.setBackgroundContext(req.backgroundContext());
        d.setAlternativesConsidered(req.alternativesConsidered());
        d.setDecisionOutcome(req.decisionOutcome());
        d.setJustification(req.justification());
        d.setImpactAssessment(req.impactAssessment());
        d.setActionsRequired(req.actionsRequired());
        d.setOwner(req.owner());
        d.setDueDate(req.dueDate());
        d.setReviewDate(req.reviewDate());
        d.setStatus(req.status() != null ? req.status() : "ACTIVE");
    }

    private String generateNumber() {
        int year = Year.now().getValue();
        int seq = repository.findMaxSequenceForYear(year) + 1;
        return String.format("DEC-%d-%04d", year, seq);
    }

    private DecisionDto toDto(DecisionRegister d) {
        return new DecisionDto(
                d.getId(), d.getDecisionNumber(), d.getTitle(), d.getDecisionDate(),
                d.getDecisionMaker(), d.getRelatedRisk(), d.getRelatedPolicyControl(),
                d.getBackgroundContext(), d.getAlternativesConsidered(), d.getDecisionOutcome(),
                d.getJustification(), d.getImpactAssessment(), d.getActionsRequired(),
                d.getOwner(), d.getDueDate(), d.getReviewDate(), d.getStatus(),
                d.getAttachmentName(), d.getCreatedBy(), d.getCreatedAt(), d.getUpdatedAt()
        );
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
