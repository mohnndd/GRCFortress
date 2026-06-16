package com.grcfortress.department;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Department> findByNameIgnoreCase(String name);
    List<Department> findAllByOrderBySortOrderAsc();
}
