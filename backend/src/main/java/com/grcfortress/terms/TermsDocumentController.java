package com.grcfortress.terms;

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
@RequestMapping("/api/v1/terms-documents")
public class TermsDocumentController {

    record TermsDocumentDto(
            Long id,
            String documentNumber,
            String title,
            String product,
            String owner,
            String description,
            String status,
            String version,
            LocalDate nextReview,
            String attachmentName,
            String createdBy,
            java.time.Instant createdAt,
            java.time.Instant updatedAt
    ) {}

    record SaveRequest(
            String title,
            String product,
            String owner,
            String description,
            String status,
            String version,
            LocalDate nextReview
    ) {}

    private final TermsDocumentRepository repository;
    private final Path uploadRoot;

    public TermsDocumentController(TermsDocumentRepository repository) {
        this.repository = repository;
        this.uploadRoot = Paths.get(System.getProperty("user.home"), "grc-fortress", "uploads", "terms");
        try { Files.createDirectories(uploadRoot); } catch (IOException ex) {
            throw new IllegalStateException("Cannot create terms upload directory", ex);
        }
    }

    @GetMapping
    public List<TermsDocumentDto> list() {
        return repository.findAllByOrderByUpdatedAtDesc().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TermsDocumentDto> get(@PathVariable Long id) {
        return repository.findById(id).map(d -> ResponseEntity.ok(toDto(d))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<TermsDocumentDto> create(@RequestBody SaveRequest req) {
        TermsDocument d = new TermsDocument();
        d.setDocumentNumber(generateNumber());
        applyRequest(d, req);
        return ResponseEntity.ok(toDto(repository.save(d)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<TermsDocumentDto> update(@PathVariable Long id, @RequestBody SaveRequest req) {
        TermsDocument d = repository.findById(id).orElse(null);
        if (d == null) return ResponseEntity.notFound().build();
        applyRequest(d, req);
        return ResponseEntity.ok(toDto(repository.save(d)));
    }

    @PostMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<TermsDocumentDto> uploadAttachment(@PathVariable Long id,
                                                              @RequestParam("file") MultipartFile file) throws IOException {
        TermsDocument d = repository.findById(id).orElse(null);
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
        TermsDocument d = repository.findById(id).orElseThrow();
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

    private void applyRequest(TermsDocument d, SaveRequest req) {
        d.setTitle(req.title());
        d.setProduct(req.product());
        d.setOwner(req.owner());
        d.setDescription(req.description());
        d.setStatus(req.status() != null ? req.status() : "DRAFT");
        d.setVersion(req.version() != null ? req.version() : "1.0");
        d.setNextReview(req.nextReview());
    }

    private String generateNumber() {
        int year = Year.now().getValue();
        int seq = repository.findMaxSequenceForYear(year) + 1;
        return String.format("TC-%d-%04d", year, seq);
    }

    private TermsDocumentDto toDto(TermsDocument d) {
        return new TermsDocumentDto(
                d.getId(), d.getDocumentNumber(), d.getTitle(), d.getProduct(),
                d.getOwner(), d.getDescription(), d.getStatus(), d.getVersion(),
                d.getNextReview(), d.getAttachmentName(),
                d.getCreatedBy(), d.getCreatedAt(), d.getUpdatedAt()
        );
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
