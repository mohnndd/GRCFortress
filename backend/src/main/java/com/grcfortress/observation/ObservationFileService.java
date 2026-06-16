package com.grcfortress.observation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ObservationFileService {

    private final Path uploadRoot;

    public ObservationFileService(
            @Value("#{systemProperties['user.home']}/grc-fortress/uploads/observations") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create observation upload directory: " + uploadDir, e);
        }
    }

    /** Stores the file and returns its path relative to uploadRoot. */
    public String store(MultipartFile file, Long observationId) {
        String ext = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path target = uploadRoot.resolve(String.valueOf(observationId)).resolve(filename);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store observation file", e);
        }
        return observationId + "/" + filename;
    }

    public Path resolve(String relativePath) {
        return uploadRoot.resolve(relativePath);
    }

    public static String detectFileType(String originalFilename) {
        if (originalFilename == null) return "OTHER";
        String lower = originalFilename.toLowerCase();
        if (lower.endsWith(".pdf"))  return "PDF";
        if (lower.endsWith(".docx")) return "DOCX";
        if (lower.endsWith(".doc"))  return "DOC";
        if (lower.endsWith(".png"))  return "PNG";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPG";
        if (lower.endsWith(".gif"))  return "GIF";
        if (lower.endsWith(".webp")) return "WEBP";
        return "OTHER";
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
