package com.grcfortress.department;

import com.grcfortress.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A stakeholder position within a department (e.g. "CTO" in "Technology").
 * {@code emailUsername} is the local part of the address only - the domain
 * is always the organization's enforced email domain, see
 * {@link com.grcfortress.config.CompanyProperties}.
 */
@Entity
@Table(name = "department_stakeholders")
public class DepartmentStakeholder extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "position_title", nullable = false, length = 255)
    private String positionTitle;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "employee_number", nullable = false, unique = true, length = 50)
    private String employeeNumber;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "email_username", nullable = false, length = 100)
    private String emailUsername;

    @Column(name = "is_head", nullable = false)
    private boolean isHead = false;

    protected DepartmentStakeholder() {
    }

    public DepartmentStakeholder(Department department, String positionTitle, String firstName, String lastName,
                                  String employeeNumber, String phoneNumber, String emailUsername) {
        this.department = department;
        this.positionTitle = positionTitle;
        this.firstName = firstName;
        this.lastName = lastName;
        this.employeeNumber = employeeNumber;
        this.phoneNumber = phoneNumber;
        this.emailUsername = emailUsername;
    }

    public Long getId() { return id; }

    public Department getDepartment() { return department; }

    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmployeeNumber() { return employeeNumber; }
    public void setEmployeeNumber(String employeeNumber) { this.employeeNumber = employeeNumber; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmailUsername() { return emailUsername; }
    public void setEmailUsername(String emailUsername) { this.emailUsername = emailUsername; }

    public boolean isHead() { return isHead; }
    public void setHead(boolean head) { isHead = head; }
}
