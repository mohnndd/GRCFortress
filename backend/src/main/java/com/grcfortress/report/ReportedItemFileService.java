package com.grcfortress.report;

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
public class ReportedItemFileService {

    private final Path uploadRoot;

    public ReportedItemFileService(
            @Value("#{systemProperties['user.home']}/grc-fortress/uploads/reported-items") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir);
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot create reported item upload directory: " + uploadDir, ex);
        }
    }

    public String store(MultipartFile file, Long itemId) {
        String filename = UUID.randomUUID() + extractExtension(file.getOriginalFilename());
        Path target = uploadRoot.resolve(String.valueOf(itemId)).resolve(filename);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store reported item attachment", ex);
        }
        return itemId + "/" + filename;
    }

    public Path resolve(String relativePath) {
        return uploadRoot.resolve(relativePath);
    }

    public static String detectFileType(String originalFilename) {
        if (originalFilename == null) return "OTHER";
        String lower = originalFilename.toLowerCase();
        if (lower.endsWith(".pdf")) return "PDF";
        if (lower.endsWith(".png")) return "PNG";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPG";
        if (lower.endsWith(".docx")) return "DOCX";
        if (lower.endsWith(".doc")) return "DOC";
        return "OTHER";
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
