package com.grcfortress.report;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Principal;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.report.dto.ReportedItemDetail;
import com.grcfortress.report.dto.ReportedItemMessageRequest;
import com.grcfortress.report.dto.ReportedItemMessageResponse;
import com.grcfortress.report.dto.ReportedItemStatusRequest;
import com.grcfortress.report.dto.ReportedItemSummary;

@RestController
@RequestMapping("/api/v1/reported-items")
public class ReportedItemController {

    private final ReportedItemService reportedItemService;
    private final ReportedItemFileService fileService;

    public ReportedItemController(ReportedItemService reportedItemService,
                                  ReportedItemFileService fileService) {
        this.reportedItemService = reportedItemService;
        this.fileService = fileService;
    }

    @GetMapping
    public List<ReportedItemSummary> list(Authentication authentication) {
        return reportedItemService.list(authentication.getName(), isAdmin(authentication));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ReportedItemSummary create(
            @RequestParam ReportType reportType,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment,
            Principal principal) {
        return reportedItemService.create(reportType, title, description, attachment, principal.getName());
    }

    @GetMapping("/{id}")
    public ReportedItemDetail get(@PathVariable Long id, Authentication authentication) {
        return reportedItemService.get(id, authentication.getName(), isAdmin(authentication));
    }

    @PutMapping("/{id}/status")
    public ReportedItemDetail updateStatus(@PathVariable Long id,
                                           @Valid @RequestBody ReportedItemStatusRequest request,
                                           Authentication authentication) {
        return reportedItemService.updateStatus(id, request.status(), authentication.getName(), isAdmin(authentication));
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportedItemMessageResponse addMessage(@PathVariable Long id,
                                                  @Valid @RequestBody ReportedItemMessageRequest request,
                                                  Authentication authentication) {
        return reportedItemService.addMessage(id, request.message(), authentication.getName(), isAdmin(authentication));
    }

    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id,
                                                       Authentication authentication) throws IOException {
        ReportedItem item = reportedItemService.requireAccessible(id, authentication.getName(), isAdmin(authentication));
        if (item.getAttachmentFilePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = fileService.resolve(item.getAttachmentFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resolveContentType(item.getAttachmentFileType())))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(item.getAttachmentFileName()).build().toString())
                .body(resource);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    private String resolveContentType(String fileType) {
        if (fileType == null) {
            return "application/octet-stream";
        }
        return switch (fileType.toUpperCase()) {
            case "PDF" -> "application/pdf";
            case "PNG" -> "image/png";
            case "JPG", "JPEG" -> "image/jpeg";
            case "DOCX" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "DOC" -> "application/msword";
            default -> "application/octet-stream";
        };
    }
}
