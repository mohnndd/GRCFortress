package com.grcfortress.contract;

import com.grcfortress.common.AuditableEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contracts")
public class Contract extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_number", nullable = false, unique = true, length = 50)
    private String contractNumber;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "counterparty", nullable = false, length = 200)
    private String counterparty;

    @Column(name = "contract_type", nullable = false, length = 50)
    private String contractType = "SERVICE";

    @Column(name = "department_owner", nullable = false, length = 200)
    private String departmentOwner;

    @Column(name = "value", precision = 18, scale = 2)
    private BigDecimal value;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "SAR";

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    public Long getId() { return id; }
    public String getContractNumber() { return contractNumber; }
    public void setContractNumber(String v) { this.contractNumber = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getCounterparty() { return counterparty; }
    public void setCounterparty(String v) { this.counterparty = v; }
    public String getContractType() { return contractType; }
    public void setContractType(String v) { this.contractType = v; }
    public String getDepartmentOwner() { return departmentOwner; }
    public void setDepartmentOwner(String v) { this.departmentOwner = v; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal v) { this.value = v; }
    public String getCurrency() { return currency; }
    public void setCurrency(String v) { this.currency = v; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate v) { this.startDate = v; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate v) { this.endDate = v; }
    public LocalDate getRenewalDate() { return renewalDate; }
    public void setRenewalDate(LocalDate v) { this.renewalDate = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { this.description = v; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String v) { this.attachmentPath = v; }
    public String getAttachmentName() { return attachmentName; }
    public void setAttachmentName(String v) { this.attachmentName = v; }
}
