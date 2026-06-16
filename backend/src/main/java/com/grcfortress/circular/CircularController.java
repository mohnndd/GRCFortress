package com.grcfortress.circular;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.circular.dto.CircularSummary;

@RestController
@RequestMapping("/api/v1/circulars")
public class CircularController {

    private final CircularService circularService;
    private final CircularFileService fileService;

    public CircularController(CircularService circularService, CircularFileService fileService) {
        this.circularService = circularService;
        this.fileService = fileService;
    }

    @GetMapping
    public List<CircularSummary> list() {
        return circularService.list();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CircularSummary create(
            @RequestParam String issuer,
            @RequestParam String description,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) MultipartFile attachment) {
        return circularService.create(issuer, description, departmentId, attachment);
    }

    @GetMapping("/{id}")
    public CircularSummary get(@PathVariable Long id) {
        return circularService.get(id);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public CircularSummary update(
            @PathVariable Long id,
            @RequestParam String issuer,
            @RequestParam String description,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) MultipartFile attachment) {
        return circularService.update(id, issuer, description, departmentId, attachment);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        circularService.delete(id);
    }

    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) throws IOException {
        Circular circular = circularService.require(id);
        if (circular.getAttachmentFilePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = fileService.resolve(circular.getAttachmentFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resolveContentType(circular.getAttachmentFileType())))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(circular.getAttachmentFileName()).build().toString())
                .body(resource);
    }

    private String resolveContentType(String fileType) {
        if (fileType == null) return "application/octet-stream";
        return switch (fileType.toUpperCase()) {
            case "PDF"  -> "application/pdf";
            case "PNG"  -> "image/png";
            case "JPG"  -> "image/jpeg";
            case "DOCX" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "DOC"  -> "application/msword";
            default     -> "application/octet-stream";
        };
    }
}
