package com.grcfortress.department;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentStakeholderRepository extends JpaRepository<DepartmentStakeholder, Long> {
    List<DepartmentStakeholder> findAllByDepartmentId(Long departmentId);
    boolean existsByEmployeeNumber(String employeeNumber);
    boolean existsByEmployeeNumberAndIdNot(String employeeNumber, Long id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
        "UPDATE DepartmentStakeholder s SET s.isHead = false WHERE s.department.id = :departmentId")
    void clearHeadForDepartment(Long departmentId);

    java.util.Optional<DepartmentStakeholder> findByEmailUsernameIgnoreCase(String emailUsername);

    java.util.Optional<DepartmentStakeholder> findByDepartmentIdAndIsHeadTrue(Long departmentId);

    List<DepartmentStakeholder> findAllByDepartmentIdAndIdNot(Long departmentId, Long excludeId);
}
