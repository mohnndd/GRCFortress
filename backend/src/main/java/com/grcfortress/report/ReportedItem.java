package com.grcfortress.report;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reported_items")
public class ReportedItem extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 32)
    private ReportType reportType;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ReportedItemStatus status = ReportedItemStatus.NEW;

    @Column(name = "reporter_username", nullable = false, length = 64)
    private String reporterUsername;

    @Column(name = "attachment_file_name", length = 500)
    private String attachmentFileName;

    @Column(name = "attachment_file_path", length = 1000)
    private String attachmentFilePath;

    @Column(name = "attachment_file_type", length = 20)
    private String attachmentFileType;

    @Column(name = "attachment_file_size_bytes")
    private Long attachmentFileSizeBytes;

    protected ReportedItem() {
    }

    public ReportedItem(ReportType reportType, String title, String description, String reporterUsername) {
        this.reportType = reportType;
        this.title = title;
        this.description = description;
        this.reporterUsername = reporterUsername;
    }

    public Long getId() { return id; }
    public ReportType getReportType() { return reportType; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public ReportedItemStatus getStatus() { return status; }
    public void setStatus(ReportedItemStatus status) { this.status = status; }
    public String getReporterUsername() { return reporterUsername; }
    public String getAttachmentFileName() { return attachmentFileName; }
    public String getAttachmentFilePath() { return attachmentFilePath; }
    public String getAttachmentFileType() { return attachmentFileType; }
    public Long getAttachmentFileSizeBytes() { return attachmentFileSizeBytes; }

    public void setAttachment(String fileName, String filePath, String fileType, Long fileSizeBytes) {
        this.attachmentFileName = fileName;
        this.attachmentFilePath = filePath;
        this.attachmentFileType = fileType;
        this.attachmentFileSizeBytes = fileSizeBytes;
    }
}
