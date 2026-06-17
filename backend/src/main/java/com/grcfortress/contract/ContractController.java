package com.grcfortress.contract;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    record ContractDto(
            Long id, String contractNumber, String title, String counterparty,
            String contractType, String departmentOwner,
            BigDecimal value, String currency,
            LocalDate startDate, LocalDate endDate, LocalDate renewalDate,
            String status, String description,
            String attachmentName,
            String createdBy, java.time.Instant createdAt, java.time.Instant updatedAt
    ) {}

    record SaveRequest(
            String title, String counterparty, String contractType,
            String departmentOwner, BigDecimal value, String currency,
            LocalDate startDate, LocalDate endDate, LocalDate renewalDate,
            String status, String description
    ) {}

    private final ContractRepository repository;
    private final Path uploadRoot;

    public ContractController(ContractRepository repository) {
        this.repository = repository;
        this.uploadRoot = Paths.get(System.getProperty("user.home"), "grc-fortress", "uploads", "contracts");
        try { Files.createDirectories(uploadRoot); } catch (IOException ex) {
            throw new IllegalStateException("Cannot create contracts upload directory", ex);
        }
    }

    @GetMapping
    public List<ContractDto> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractDto> get(@PathVariable Long id) {
        return repository.findById(id).map(c -> ResponseEntity.ok(toDto(c))).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<ContractDto> create(@RequestBody SaveRequest req) {
        Contract c = new Contract();
        c.setContractNumber(generateNumber());
        applyRequest(c, req);
        return ResponseEntity.ok(toDto(repository.save(c)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<ContractDto> update(@PathVariable Long id, @RequestBody SaveRequest req) {
        Contract c = repository.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();
        applyRequest(c, req);
        return ResponseEntity.ok(toDto(repository.save(c)));
    }

    @PostMapping("/{id}/attachment")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public ResponseEntity<ContractDto> uploadAttachment(@PathVariable Long id,
                                                        @RequestParam("file") MultipartFile file) throws IOException {
        Contract c = repository.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();

        String ext = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path target = uploadRoot.resolve(String.valueOf(id)).resolve(filename);
        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        c.setAttachmentPath(id + "/" + filename);
        c.setAttachmentName(file.getOriginalFilename());
        return ResponseEntity.ok(toDto(repository.save(c)));
    }

    @GetMapping("/{id}/attachment")
    public void downloadAttachment(@PathVariable Long id, HttpServletResponse response) throws IOException {
        Contract c = repository.findById(id).orElseThrow();
        if (c.getAttachmentPath() == null) { response.setStatus(404); return; }
        Path file = uploadRoot.resolve(c.getAttachmentPath());
        response.setHeader("Content-Disposition", "attachment; filename=\"" + c.getAttachmentName() + "\"");
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

    // ── CSV export ─────────────────────────────────────────────────────────

    @GetMapping("/export")
    public void exportCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"contracts.csv\"");
        var writer = response.getWriter();
        writer.println("Contract Number,Title,Counterparty,Type,Department Owner,Value,Currency,Start Date,End Date,Renewal Date,Status");
        for (Contract c : repository.findAllByOrderByCreatedAtDesc()) {
            writer.printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s%n",
                    csv(c.getContractNumber()), csv(c.getTitle()), csv(c.getCounterparty()),
                    csv(c.getContractType()), csv(c.getDepartmentOwner()),
                    c.getValue() != null ? c.getValue().toPlainString() : "",
                    csv(c.getCurrency()),
                    c.getStartDate() != null ? c.getStartDate() : "",
                    c.getEndDate() != null ? c.getEndDate() : "",
                    c.getRenewalDate() != null ? c.getRenewalDate() : "",
                    csv(c.getStatus()));
        }
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private void applyRequest(Contract c, SaveRequest req) {
        c.setTitle(req.title());
        c.setCounterparty(req.counterparty());
        c.setContractType(req.contractType() != null ? req.contractType() : "SERVICE");
        c.setDepartmentOwner(req.departmentOwner());
        c.setValue(req.value());
        c.setCurrency(req.currency() != null ? req.currency() : "SAR");
        c.setStartDate(req.startDate());
        c.setEndDate(req.endDate());
        c.setRenewalDate(req.renewalDate());
        c.setStatus(req.status() != null ? req.status() : "ACTIVE");
        c.setDescription(req.description());
    }

    private String generateNumber() {
        int year = Year.now().getValue();
        int seq = repository.findMaxSequenceForYear(year) + 1;
        return String.format("CON-%d-%04d", year, seq);
    }

    private ContractDto toDto(Contract c) {
        return new ContractDto(c.getId(), c.getContractNumber(), c.getTitle(), c.getCounterparty(),
                c.getContractType(), c.getDepartmentOwner(), c.getValue(), c.getCurrency(),
                c.getStartDate(), c.getEndDate(), c.getRenewalDate(),
                c.getStatus(), c.getDescription(), c.getAttachmentName(),
                c.getCreatedBy(), c.getCreatedAt(), c.getUpdatedAt());
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }

    private static String csv(String v) {
        if (v == null) return "";
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
