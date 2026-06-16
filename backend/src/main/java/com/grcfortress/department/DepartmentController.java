package com.grcfortress.department;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.department.dto.DepartmentRequest;
import com.grcfortress.department.dto.DepartmentResponse;
import com.grcfortress.department.dto.StakeholderRequest;
import com.grcfortress.department.dto.StakeholderResponse;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<DepartmentResponse> list() {
        return departmentService.listDepartments();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public DepartmentResponse create(@Valid @RequestBody DepartmentRequest request) {
        return departmentService.createDepartment(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public DepartmentResponse update(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return departmentService.updateDepartment(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public void delete(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
    }

    @GetMapping("/{id}/stakeholders")
    public List<StakeholderResponse> listStakeholders(@PathVariable Long id) {
        return departmentService.listStakeholders(id);
    }

    @PostMapping("/{id}/stakeholders")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public StakeholderResponse addStakeholder(@PathVariable Long id, @Valid @RequestBody StakeholderRequest request) {
        return departmentService.addStakeholder(id, request);
    }

    @PutMapping("/{id}/stakeholders/{stakeholderId}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public StakeholderResponse updateStakeholder(@PathVariable Long id, @PathVariable Long stakeholderId,
                                                  @Valid @RequestBody StakeholderRequest request) {
        return departmentService.updateStakeholder(id, stakeholderId, request);
    }

    @PutMapping("/{id}/stakeholders/{stakeholderId}/designate-head")
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public StakeholderResponse designateHead(@PathVariable Long id, @PathVariable Long stakeholderId) {
        return departmentService.designateHead(id, stakeholderId);
    }

    @DeleteMapping("/{id}/stakeholders/{stakeholderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE_OFFICER')")
    public void deleteStakeholder(@PathVariable Long id, @PathVariable Long stakeholderId) {
        departmentService.deleteStakeholder(id, stakeholderId);
    }
}
