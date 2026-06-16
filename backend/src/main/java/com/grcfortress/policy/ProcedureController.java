package com.grcfortress.policy;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.policy.dto.ApprovalCycleDetail;
import com.grcfortress.policy.dto.PolicyDetail;
import com.grcfortress.policy.dto.PolicyListItem;
import com.grcfortress.policy.dto.PreDecisionRequest;

import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/v1/procedures")
public class ProcedureController {

    private final PolicyService policyService;
    private final PolicyFileService fileService;
    private final PolicyVersionFileRepository versionFileRepository;

    public ProcedureController(PolicyService policyService, PolicyFileService fileService,
                               PolicyVersionFileRepository versionFileRepository) {
        this.policyService = policyService;
        this.fileService = fileService;
        this.versionFileRepository = versionFileRepository;
    }

    @GetMapping
    public List<PolicyListItem> list() {
        return policyService.listProcedures();
    }

    @GetMapping("/{id}")
    public PolicyDetail get(@PathVariable Long id, java.security.Principal principal) {
        return policyService.getPolicy(id, principal.getName());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PolicyListItem upload(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam("changeReason") String changeReason,
            @RequestParam(value = "changeSummary", required = false) String changeSummary,
            @RequestParam(value = "previousVersionId", required = false) Long previousVersionId,
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "product", required = false) String product,
            @RequestParam(value = "workflowFile", required = false) MultipartFile workflowFile,
            @RequestParam(value = "slaFile", required = false) MultipartFile slaFile,
            java.security.Principal principal) {
        return policyService.uploadProcedure(files, title, description, category,
                changeReason, changeSummary, previousVersionId, departmentId, product,
                workflowFile, slaFile, principal.getName());
    }

    @GetMapping("/files/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) throws IOException {
        PolicyVersionFile pvf = versionFileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));
        Path filePath = fileService.resolve(pvf.getFilePath());
        if (!Files.exists(filePath)) return ResponseEntity.notFound().build();
        Resource resource = new PathResource(filePath);
        String contentType = resolveContentType(pvf.getFileType());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(pvf.getFileName()).build().toString())
                .body(resource);
    }

    /** Serve workflow or SLA file stored directly on the procedure. */
    @GetMapping("/{id}/attachment/{type}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id,
                                                       @PathVariable String type) throws IOException {
        PolicyDetail detail = policyService.getPolicy(id, "__system__");
        String filePath = type.equals("workflow") ? detail.workflowFilePath() : detail.slaFilePath();
        String fileName = type.equals("workflow") ? detail.workflowFileName() : detail.slaFileName();
        if (filePath == null) return ResponseEntity.notFound().build();
        Path resolved = fileService.resolve(filePath);
        if (!Files.exists(resolved)) return ResponseEntity.notFound().build();
        Resource resource = new PathResource(resolved);
        String contentType = resolveContentType(PolicyFileService.detectFileType(fileName));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(fileName).build().toString())
                .body(resource);
    }

    @PostMapping("/{procedureId}/versions/{versionId}/pre-approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void preApprove(@PathVariable Long procedureId, @PathVariable Long versionId,
                           @RequestBody(required = false) PreDecisionRequest req,
                           java.security.Principal principal) {
        policyService.preApprove(versionId, req != null ? req.comments() : null, principal.getName());
    }

    @PostMapping("/{procedureId}/versions/{versionId}/pre-reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void preReject(@PathVariable Long procedureId, @PathVariable Long versionId,
                          @RequestBody(required = false) PreDecisionRequest req,
                          java.security.Principal principal) {
        policyService.preReject(versionId, req != null ? req.comments() : null, principal.getName());
    }

    @GetMapping("/{procedureId}/versions/{versionId}/cycle")
    public ResponseEntity<ApprovalCycleDetail> getCycle(@PathVariable Long procedureId,
                                                        @PathVariable Long versionId,
                                                        java.security.Principal principal) {
        return policyService.getCycle(versionId, principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private static String resolveContentType(String fileType) {
        return switch (fileType.toUpperCase()) {
            case "PDF"  -> "application/pdf";
            case "DOCX" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "DOC"  -> "application/msword";
            case "PNG"  -> "image/png";
            case "JPG", "JPEG" -> "image/jpeg";
            case "GIF"  -> "image/gif";
            case "WEBP" -> "image/webp";
            default     -> "application/octet-stream";
        };
    }
}
