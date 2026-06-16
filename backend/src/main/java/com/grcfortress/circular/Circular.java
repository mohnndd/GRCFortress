package com.grcfortress.circular;

import com.grcfortress.common.AuditableEntity;
import com.grcfortress.department.Department;

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
@Table(name = "circulars")
public class Circular extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "circular_number", nullable = false, unique = true, length = 20)
    private String circularNumber;

    @Column(name = "issuer", nullable = false)
    private String issuer;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "attachment_file_name", length = 500)
    private String attachmentFileName;

    @Column(name = "attachment_file_path", length = 1000)
    private String attachmentFilePath;

    @Column(name = "attachment_file_type", length = 20)
    private String attachmentFileType;

    @Column(name = "attachment_file_size_bytes")
    private Long attachmentFileSizeBytes;

    protected Circular() {}

    public Circular(String circularNumber, String issuer, String description, Department department) {
        this.circularNumber = circularNumber;
        this.issuer = issuer;
        this.description = description;
        this.department = department;
    }

    public Long getId() { return id; }
    public String getCircularNumber() { return circularNumber; }
    public String getIssuer() { return issuer; }
    public String getDescription() { return description; }
    public Department getDepartment() { return department; }
    public String getAttachmentFileName() { return attachmentFileName; }
    public String getAttachmentFilePath() { return attachmentFilePath; }
    public String getAttachmentFileType() { return attachmentFileType; }
    public Long getAttachmentFileSizeBytes() { return attachmentFileSizeBytes; }

    public void setIssuer(String issuer) { this.issuer = issuer; }
    public void setDescription(String description) { this.description = description; }
    public void setDepartment(Department department) { this.department = department; }

    public void setAttachment(String fileName, String filePath, String fileType, Long fileSizeBytes) {
        this.attachmentFileName = fileName;
        this.attachmentFilePath = filePath;
        this.attachmentFileType = fileType;
        this.attachmentFileSizeBytes = fileSizeBytes;
    }

    public void clearAttachment() {
        this.attachmentFileName = null;
        this.attachmentFilePath = null;
        this.attachmentFileType = null;
        this.attachmentFileSizeBytes = null;
    }
}
