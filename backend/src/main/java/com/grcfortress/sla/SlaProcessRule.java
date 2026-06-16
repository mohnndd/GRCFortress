package com.grcfortress.sla;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sla_process_rules")
public class SlaProcessRule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "process_type", nullable = false, unique = true, length = 50)
    private String processType;

    @Column(name = "business_days_per_step", nullable = false)
    private int businessDaysPerStep;

    protected SlaProcessRule() {}

    public SlaProcessRule(String processType, int businessDaysPerStep) {
        this.processType = processType;
        this.businessDaysPerStep = businessDaysPerStep;
    }

    public Long getId() { return id; }
    public String getProcessType() { return processType; }
    public int getBusinessDaysPerStep() { return businessDaysPerStep; }
    public void setBusinessDaysPerStep(int businessDaysPerStep) { this.businessDaysPerStep = businessDaysPerStep; }
}
