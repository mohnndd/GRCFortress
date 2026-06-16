package com.grcfortress.circular;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.circular.dto.CircularSummary;
import com.grcfortress.department.Department;
import com.grcfortress.department.DepartmentRepository;

@Service
@Transactional
public class CircularService {

    private final CircularRepository circularRepository;
    private final DepartmentRepository departmentRepository;
    private final CircularFileService fileService;

    public CircularService(CircularRepository circularRepository,
                           DepartmentRepository departmentRepository,
                           CircularFileService fileService) {
        this.circularRepository = circularRepository;
        this.departmentRepository = departmentRepository;
        this.fileService = fileService;
    }

    @Transactional(readOnly = true)
    public List<CircularSummary> list() {
        return circularRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toSummary).toList();
    }

    public CircularSummary create(String issuer,
                                  String description,
                                  Long departmentId,
                                  MultipartFile attachment) {
        Department department = departmentId != null
                ? departmentRepository.findById(departmentId).orElse(null)
                : null;

        String number = generateNumber();
        Circular circular = circularRepository.save(new Circular(number, issuer.strip(), description.strip(), department));

        if (attachment != null && !attachment.isEmpty()) {
            String relativePath = fileService.store(attachment, circular.getId());
            String originalName = attachment.getOriginalFilename() != null
                    ? attachment.getOriginalFilename() : "attachment";
            circular.setAttachment(
                    originalName,
                    relativePath,
                    CircularFileService.detectFileType(originalName),
                    attachment.getSize());
            circular = circularRepository.save(circular);
        }

        return toSummary(circular);
    }

    @Transactional(readOnly = true)
    public CircularSummary get(Long id) {
        return toSummary(require(id));
    }

    public CircularSummary update(Long id, String issuer, String description, Long departmentId, MultipartFile attachment) {
        Circular circular = require(id);
        circular.setIssuer(issuer.strip());
        circular.setDescription(description.strip());
        circular.setDepartment(departmentId != null
                ? departmentRepository.findById(departmentId).orElse(null)
                : null);

        if (attachment != null && !attachment.isEmpty()) {
            String relativePath = fileService.store(attachment, circular.getId());
            String originalName = attachment.getOriginalFilename() != null
                    ? attachment.getOriginalFilename() : "attachment";
            circular.setAttachment(
                    originalName,
                    relativePath,
                    CircularFileService.detectFileType(originalName),
                    attachment.getSize());
        }

        return toSummary(circularRepository.save(circular));
    }

    public void delete(Long id) {
        circularRepository.delete(require(id));
    }

    public Circular require(Long id) {
        return circularRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Circular not found: " + id));
    }

    private String generateNumber() {
        long next = circularRepository.count() + 1;
        return String.format("CIR-%03d", next);
    }

    private CircularSummary toSummary(Circular c) {
        return new CircularSummary(
                c.getId(),
                c.getCircularNumber(),
                c.getIssuer(),
                c.getDescription(),
                c.getDepartment() != null ? c.getDepartment().getId() : null,
                c.getDepartment() != null ? c.getDepartment().getName() : null,
                c.getAttachmentFileName(),
                c.getAttachmentFileType(),
                c.getAttachmentFileSizeBytes(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
