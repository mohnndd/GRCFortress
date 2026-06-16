package com.grcfortress.observation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.observation.dto.ClosureRequestDto;
import com.grcfortress.observation.dto.ConfirmDateRequest;
import com.grcfortress.observation.dto.ObservationDetail;
import com.grcfortress.observation.dto.ObservationListItem;
import com.grcfortress.observation.dto.ObservationMessageDto;
import com.grcfortress.observation.dto.PostMessageRequest;
import com.grcfortress.observation.dto.RejectEvidenceRequest;

@RestController
@RequestMapping("/api/v1/observations")
public class ObservationController {

    private final ObservationService observationService;
    private final ObservationFileService fileService;
    private final ObservationRepository observationRepository;
    private final ObservationClosureRequestRepository closureRequestRepository;

    public ObservationController(
            ObservationService observationService,
            ObservationFileService fileService,
            ObservationRepository observationRepository,
            ObservationClosureRequestRepository closureRequestRepository) {
        this.observationService = observationService;
        this.fileService = fileService;
        this.observationRepository = observationRepository;
        this.closureRequestRepository = closureRequestRepository;
    }

    @GetMapping
    public List<ObservationListItem> list() {
        return observationService.listAll();
    }

    @GetMapping("/{id}")
    public ObservationDetail get(@PathVariable Long id, Principal principal) {
        return observationService.getObservation(id, principal.getName());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ObservationListItem create(
            @RequestParam(value = "regulationFile", required = false) MultipartFile regulationFile,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "controlViolation", required = false) String controlViolation,
            @RequestParam(value = "isRegulationRelated", defaultValue = "false") boolean isRegulationRelated,
            @RequestParam(value = "proposedTargetDate", required = false)
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate proposedTargetDate,
            @RequestParam("receivingDepartmentId") Long receivingDepartmentId,
            Principal principal) {
        return observationService.createObservation(
                regulationFile, name, description, controlViolation,
                isRegulationRelated, proposedTargetDate, receivingDepartmentId,
                principal.getName());
    }

    @PostMapping("/{id}/confirm-date")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmDate(@PathVariable Long id,
                            @RequestBody @Valid ConfirmDateRequest req,
                            Principal principal) {
        observationService.confirmTargetDate(id, req, principal.getName());
    }

    @PostMapping("/{id}/messages")
    public ObservationMessageDto postMessage(@PathVariable Long id,
                                             @RequestBody @Valid PostMessageRequest req,
                                             Principal principal) {
        return observationService.postMessage(id, req.message(), principal.getName());
    }

    @PostMapping(value = "/{id}/request-closure", consumes = {
            MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_FORM_URLENCODED_VALUE,
            MediaType.APPLICATION_JSON_VALUE
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestClosure(
            @PathVariable Long id,
            @RequestParam(value = "evidenceFile", required = false) MultipartFile evidenceFile,
            @RequestParam(value = "notes", required = false) String notes,
            Principal principal) {
        observationService.requestClosure(id, evidenceFile, notes, principal.getName());
    }

    @PostMapping("/{id}/accept-closure")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acceptClosure(@PathVariable Long id,
                              Principal principal) {
        observationService.acceptClosure(id, principal.getName());
    }

    @PostMapping("/{id}/reject-closure")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectClosure(@PathVariable Long id,
                              @RequestBody(required = false) RejectEvidenceRequest req,
                              Principal principal) {
        observationService.rejectClosure(id, req != null ? req.rejectionReason() : null, principal.getName());
    }

    @GetMapping("/{id}/files/regulation")
    public ResponseEntity<Resource> serveRegulationFile(@PathVariable Long id) throws IOException {
        Observation obs = observationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Observation not found: " + id));
        if (obs.getRegulationFilePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = fileService.resolve(obs.getRegulationFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        String fileName = obs.getRegulationFileName() != null ? obs.getRegulationFileName() : "regulation";
        String contentType = resolveContentType(ObservationFileService.detectFileType(fileName));
        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(fileName).build().toString())
                .body(resource);
    }

    @GetMapping("/{id}/files/evidence/{closureRequestId}")
    public ResponseEntity<Resource> serveEvidenceFile(@PathVariable Long id,
                                                       @PathVariable Long closureRequestId) throws IOException {
        ObservationClosureRequest closure = closureRequestRepository.findById(closureRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Closure request not found: " + closureRequestId));
        if (!closure.getObservation().getId().equals(id)) {
            return ResponseEntity.badRequest().build();
        }
        if (closure.getEvidenceFilePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = fileService.resolve(closure.getEvidenceFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        String fileName = closure.getEvidenceFileName() != null ? closure.getEvidenceFileName() : "evidence";
        String contentType = resolveContentType(ObservationFileService.detectFileType(fileName));
        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(fileName).build().toString())
                .body(resource);
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
