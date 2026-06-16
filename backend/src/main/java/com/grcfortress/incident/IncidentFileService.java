package com.grcfortress.incident;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class IncidentFileService {

    private final Path uploadRoot;

    public IncidentFileService(
            @Value("#{systemProperties['user.home']}/grc-fortress/uploads/incidents") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot create incident upload directory: " + uploadDir, ex);
        }
    }

    public String store(MultipartFile file, Long incidentId) {
        String filename = UUID.randomUUID() + extractExtension(file.getOriginalFilename());
        Path target = uploadRoot.resolve(String.valueOf(incidentId)).resolve(filename);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store incident notification attachment", ex);
        }
        return incidentId + "/" + filename;
    }

    public Path resolve(String relativePath) {
        return uploadRoot.resolve(relativePath);
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
