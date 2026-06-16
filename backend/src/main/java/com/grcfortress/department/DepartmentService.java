package com.grcfortress.department;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grcfortress.config.CompanyProperties;
import com.grcfortress.department.dto.DepartmentRequest;
import com.grcfortress.department.dto.DepartmentResponse;
import com.grcfortress.department.dto.StakeholderRequest;
import com.grcfortress.department.dto.StakeholderResponse;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentStakeholderRepository stakeholderRepository;
    private final CompanyProperties companyProperties;

    public DepartmentService(DepartmentRepository departmentRepository,
                              DepartmentStakeholderRepository stakeholderRepository,
                              CompanyProperties companyProperties) {
        this.departmentRepository = departmentRepository;
        this.stakeholderRepository = stakeholderRepository;
        this.companyProperties = companyProperties;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listDepartments() {
        return departmentRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException("A department named '" + request.name() + "' already exists");
        }
        int sortOrder = request.sortOrder() != null ? request.sortOrder()
                : departmentRepository.findAllByOrderBySortOrderAsc().stream()
                        .mapToInt(Department::getSortOrder).max().orElse(0) + 10;
        Department dept = new Department(request.name().strip(), request.description(), sortOrder);
        return toResponse(departmentRepository.save(dept));
    }

    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
        if (!dept.getName().equalsIgnoreCase(request.name())
                && departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException("A department named '" + request.name() + "' already exists");
        }
        dept.setName(request.name().strip());
        dept.setDescription(request.description());
        if (request.sortOrder() != null) {
            dept.setSortOrder(request.sortOrder());
        }
        return toResponse(departmentRepository.save(dept));
    }

    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new IllegalArgumentException("Department not found: " + id);
        }
        departmentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<StakeholderResponse> listStakeholders(Long departmentId) {
        requireDepartmentExists(departmentId);
        return stakeholderRepository.findAllByDepartmentId(departmentId).stream()
                .map(this::toStakeholderResponse)
                .toList();
    }

    public StakeholderResponse addStakeholder(Long departmentId, StakeholderRequest request) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + departmentId));
        if (stakeholderRepository.existsByEmployeeNumber(request.employeeNumber())) {
            throw new IllegalArgumentException("Employee number '" + request.employeeNumber() + "' is already in use");
        }
        DepartmentStakeholder stakeholder = new DepartmentStakeholder(
                dept,
                request.positionTitle().strip(),
                request.firstName().strip(),
                request.lastName().strip(),
                request.employeeNumber().strip(),
                normalizePhone(request.phoneNumber()),
                request.emailUsername().strip().toLowerCase()
        );
        return toStakeholderResponse(stakeholderRepository.save(stakeholder));
    }

    public StakeholderResponse updateStakeholder(Long departmentId, Long stakeholderId, StakeholderRequest request) {
        requireDepartmentExists(departmentId);
        DepartmentStakeholder stakeholder = stakeholderRepository.findById(stakeholderId)
                .orElseThrow(() -> new IllegalArgumentException("Stakeholder not found: " + stakeholderId));
        if (!stakeholder.getDepartment().getId().equals(departmentId)) {
            throw new IllegalArgumentException("Stakeholder does not belong to this department");
        }
        if (!stakeholder.getEmployeeNumber().equals(request.employeeNumber())
                && stakeholderRepository.existsByEmployeeNumberAndIdNot(request.employeeNumber(), stakeholderId)) {
            throw new IllegalArgumentException("Employee number '" + request.employeeNumber() + "' is already in use");
        }
        stakeholder.setPositionTitle(request.positionTitle().strip());
        stakeholder.setFirstName(request.firstName().strip());
        stakeholder.setLastName(request.lastName().strip());
        stakeholder.setEmployeeNumber(request.employeeNumber().strip());
        stakeholder.setPhoneNumber(normalizePhone(request.phoneNumber()));
        stakeholder.setEmailUsername(request.emailUsername().strip().toLowerCase());
        return toStakeholderResponse(stakeholderRepository.save(stakeholder));
    }

    public StakeholderResponse designateHead(Long departmentId, Long stakeholderId) {
        requireDepartmentExists(departmentId);
        DepartmentStakeholder stakeholder = stakeholderRepository.findById(stakeholderId)
                .orElseThrow(() -> new IllegalArgumentException("Stakeholder not found: " + stakeholderId));
        if (!stakeholder.getDepartment().getId().equals(departmentId)) {
            throw new IllegalArgumentException("Stakeholder does not belong to this department");
        }
        stakeholderRepository.clearHeadForDepartment(departmentId);
        stakeholder.setHead(true);
        return toStakeholderResponse(stakeholderRepository.save(stakeholder));
    }

    public void deleteStakeholder(Long departmentId, Long stakeholderId) {
        requireDepartmentExists(departmentId);
        DepartmentStakeholder stakeholder = stakeholderRepository.findById(stakeholderId)
                .orElseThrow(() -> new IllegalArgumentException("Stakeholder not found: " + stakeholderId));
        if (!stakeholder.getDepartment().getId().equals(departmentId)) {
            throw new IllegalArgumentException("Stakeholder does not belong to this department");
        }
        stakeholderRepository.deleteById(stakeholderId);
    }

    private void requireDepartmentExists(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new IllegalArgumentException("Department not found: " + departmentId);
        }
    }

    /** Normalizes +9665XXXXXXXX or 05XXXXXXXX -> +9665XXXXXXXX */
    private String normalizePhone(String phone) {
        if (phone.startsWith("0")) {
            return "+966" + phone.substring(1);
        }
        return phone;
    }

    private DepartmentResponse toResponse(Department dept) {
        return new DepartmentResponse(
                dept.getId(),
                dept.getName(),
                dept.getDescription(),
                dept.getSortOrder(),
                dept.getStakeholders().size(),
                dept.getCreatedAt(),
                dept.getUpdatedAt()
        );
    }

    private StakeholderResponse toStakeholderResponse(DepartmentStakeholder s) {
        String email = s.getEmailUsername() + "@" + companyProperties.getEmailDomain();
        return new StakeholderResponse(
                s.getId(),
                s.getDepartment().getId(),
                s.getPositionTitle(),
                s.getFirstName(),
                s.getLastName(),
                s.getEmployeeNumber(),
                s.getPhoneNumber(),
                s.getEmailUsername(),
                email,
                s.isHead()
        );
    }
}
