package com.grcfortress.incident;

import com.grcfortress.incident.dto.IncidentDetail;
import com.grcfortress.incident.dto.IncidentSummary;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public List<IncidentSummary> list() {
        return incidentService.list();
    }

    @GetMapping("/{id}")
    public IncidentDetail get(@PathVariable Long id) {
        return incidentService.get(id);
    }

    @PostMapping
    public IncidentSummary create(
            @RequestBody IncidentService.CreateRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return incidentService.create(req, principal.getUsername());
    }

    @PutMapping("/{id}")
    public IncidentSummary update(
            @PathVariable Long id,
            @RequestBody IncidentService.UpdateRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return incidentService.update(id, req, principal.getUsername());
    }

    @PostMapping("/{id}/progress")
    public IncidentDetail addProgress(
            @PathVariable Long id,
            @RequestBody IncidentService.ProgressRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return incidentService.addProgress(id, req, principal.getUsername());
    }

    @PostMapping(value = "/{id}/notification-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public IncidentSummary uploadNotificationAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal) {
        return incidentService.uploadNotificationAttachment(id, file, principal.getUsername());
    }

    @GetMapping("/{id}/notification-attachment")
    public ResponseEntity<Resource> downloadNotificationAttachment(@PathVariable Long id) {
        Path filePath = incidentService.resolveAttachment(id);
        Resource resource = new PathResource(filePath);
        String filename = filePath.getFileName().toString();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/rca")
    public IncidentDetail setRca(
            @PathVariable Long id,
            @RequestBody IncidentService.RcaRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return incidentService.setRca(id, req, principal.getUsername());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        incidentService.delete(id);
    }
}
