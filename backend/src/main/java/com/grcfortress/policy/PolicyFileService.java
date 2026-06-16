package com.grcfortress.policy;

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
public class PolicyFileService {

    private final Path uploadRoot;

    public PolicyFileService(
            @Value("#{systemProperties['user.home']}/grc-fortress/uploads/policies") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create policy upload directory: " + uploadDir, e);
        }
    }

    /** Stores the file and returns its path relative to uploadRoot. */
    public String store(MultipartFile file, Long policyId) {
        String ext = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path target = uploadRoot.resolve(String.valueOf(policyId)).resolve(filename);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store policy file", e);
        }
        return policyId + "/" + filename;
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

    public static boolean isPreviewable(String fileType) {
        return switch (fileType.toUpperCase()) {
            case "PDF", "PNG", "JPG", "JPEG", "GIF", "WEBP", "DOCX" -> true;
            default -> false;
        };
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
