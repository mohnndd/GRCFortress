package com.grcfortress.terms;

import com.grcfortress.common.AuditableEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "terms_documents")
public class TermsDocument extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_number", nullable = false, unique = true, length = 50)
    private String documentNumber;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "product", nullable = false, length = 200)
    private String product;

    @Column(name = "owner", nullable = false, length = 200)
    private String owner;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "DRAFT";

    @Column(name = "version", nullable = false, length = 20)
    private String version = "1.0";

    @Column(name = "next_review")
    private LocalDate nextReview;

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    public Long getId() { return id; }
    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String v) { this.documentNumber = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getProduct() { return product; }
    public void setProduct(String v) { this.product = v; }
    public String getOwner() { return owner; }
    public void setOwner(String v) { this.owner = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public String getVersion() { return version; }
    public void setVersion(String v) { this.version = v; }
    public LocalDate getNextReview() { return nextReview; }
    public void setNextReview(LocalDate v) { this.nextReview = v; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String v) { this.attachmentPath = v; }
    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String v) { this.attachmentName = v; }
}
