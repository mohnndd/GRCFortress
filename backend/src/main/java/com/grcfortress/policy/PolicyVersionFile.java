package com.grcfortress.policy;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_version_files")
public class PolicyVersionFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id", nullable = false)
    private PolicyVersion version;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "file_type", nullable = false, length = 10)
    private String fileType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected PolicyVersionFile() {
    }

    public PolicyVersionFile(PolicyVersion version, String fileName, String filePath,
                              String fileType, Long fileSizeBytes, int sortOrder) {
        this.version = version;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileType = fileType;
        this.fileSizeBytes = fileSizeBytes;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public PolicyVersion getVersion() { return version; }
    public String getFileName() { return fileName; }
    public String getFilePath() { return filePath; }
    public String getFileType() { return fileType; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
}
