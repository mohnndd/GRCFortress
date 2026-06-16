package com.grcfortress.observation;

import java.time.LocalDate;

import com.grcfortress.circular.Circular;
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
@Table(name = "observations")
public class Observation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "observation_number", nullable = false, unique = true, length = 100)
    private String observationNumber;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "control_violation", columnDefinition = "TEXT")
    private String controlViolation;

    @Column(name = "is_regulation_related", nullable = false)
    private boolean isRegulationRelated = false;

    @Column(name = "regulation_file_name", length = 500)
    private String regulationFileName;

    @Column(name = "regulation_file_path", length = 1000)
    private String regulationFilePath;

    @Column(name = "proposed_target_date")
    private LocalDate proposedTargetDate;

    @Column(name = "confirmed_target_date")
    private LocalDate confirmedTargetDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ObservationStatus status = ObservationStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_circular_id")
    private Circular linkedCircular;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_department_id", nullable = false)
    private Department creatorDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiving_department_id", nullable = false)
    private Department receivingDepartment;

    protected Observation() {}

    public Observation(String observationNumber, String name, Department creatorDepartment, Department receivingDepartment) {
        this.observationNumber = observationNumber;
        this.name = name;
        this.creatorDepartment = creatorDepartment;
        this.receivingDepartment = receivingDepartment;
    }

    public Long getId() { return id; }

    public String getObservationNumber() { return observationNumber; }
    public void setObservationNumber(String observationNumber) { this.observationNumber = observationNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getControlViolation() { return controlViolation; }
    public void setControlViolation(String controlViolation) { this.controlViolation = controlViolation; }

    public boolean isRegulationRelated() { return isRegulationRelated; }
    public void setRegulationRelated(boolean regulationRelated) { isRegulationRelated = regulationRelated; }

    public String getRegulationFileName() { return regulationFileName; }
    public void setRegulationFileName(String regulationFileName) { this.regulationFileName = regulationFileName; }

    public String getRegulationFilePath() { return regulationFilePath; }
    public void setRegulationFilePath(String regulationFilePath) { this.regulationFilePath = regulationFilePath; }

    public Circular getLinkedCircular() { return linkedCircular; }
    public void setLinkedCircular(Circular linkedCircular) { this.linkedCircular = linkedCircular; }

    public LocalDate getProposedTargetDate() { return proposedTargetDate; }
    public void setProposedTargetDate(LocalDate proposedTargetDate) { this.proposedTargetDate = proposedTargetDate; }

    public LocalDate getConfirmedTargetDate() { return confirmedTargetDate; }
    public void setConfirmedTargetDate(LocalDate confirmedTargetDate) { this.confirmedTargetDate = confirmedTargetDate; }

    public ObservationStatus getStatus() { return status; }
    public void setStatus(ObservationStatus status) { this.status = status; }

    public Department getCreatorDepartment() { return creatorDepartment; }
    public void setCreatorDepartment(Department creatorDepartment) { this.creatorDepartment = creatorDepartment; }

    public Department getReceivingDepartment() { return receivingDepartment; }
    public void setReceivingDepartment(Department receivingDepartment) { this.receivingDepartment = receivingDepartment; }
}
