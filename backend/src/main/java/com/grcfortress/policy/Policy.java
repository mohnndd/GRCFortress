package com.grcfortress.policy;

import com.grcfortress.common.AuditableEntity;
import com.grcfortress.department.Department;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "policies")
public class Policy extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "policy_number", nullable = false, unique = true, length = 100)
    private String policyNumber;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 200)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PolicyStatus status = PolicyStatus.DRAFT;

    @Column(name = "current_version_id")
    private Long currentVersionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "product", length = 300)
    private String product;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private DocumentType documentType = DocumentType.POLICY;

    @Column(name = "workflow_file_name", length = 500)
    private String workflowFileName;

    @Column(name = "workflow_file_path", length = 1000)
    private String workflowFilePath;

    @Column(name = "sla_file_name", length = 500)
    private String slaFileName;

    @Column(name = "sla_file_path", length = 1000)
    private String slaFilePath;

    protected Policy() {
    }

    public Policy(String title, String policyNumber, String description, String category, DocumentType documentType) {
        this.title = title;
        this.policyNumber = policyNumber;
        this.description = description;
        this.category = category;
        this.documentType = documentType;
    }

    public Long getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPolicyNumber() { return policyNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public PolicyStatus getStatus() { return status; }
    public void setStatus(PolicyStatus status) { this.status = status; }

    public Long getCurrentVersionId() { return currentVersionId; }
    public void setCurrentVersionId(Long currentVersionId) { this.currentVersionId = currentVersionId; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getProduct() { return product; }
    public void setProduct(String product) { this.product = product; }

    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }

    public String getWorkflowFileName() { return workflowFileName; }
    public void setWorkflowFileName(String workflowFileName) { this.workflowFileName = workflowFileName; }

    public String getWorkflowFilePath() { return workflowFilePath; }
    public void setWorkflowFilePath(String workflowFilePath) { this.workflowFilePath = workflowFilePath; }

    public String getSlaFileName() { return slaFileName; }
    public void setSlaFileName(String slaFileName) { this.slaFileName = slaFileName; }

    public String getSlaFilePath() { return slaFilePath; }
    public void setSlaFilePath(String slaFilePath) { this.slaFilePath = slaFilePath; }
}
