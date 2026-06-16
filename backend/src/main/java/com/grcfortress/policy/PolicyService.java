package com.grcfortress.policy;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.department.Department;
import com.grcfortress.department.DepartmentRepository;
import com.grcfortress.department.DepartmentStakeholder;
import com.grcfortress.department.DepartmentStakeholderRepository;
import com.grcfortress.policy.dto.ApprovalCycleDetail;
import com.grcfortress.policy.dto.ApprovalStepDetail;
import com.grcfortress.policy.dto.PolicyDetail;
import com.grcfortress.policy.dto.PolicyListItem;
import com.grcfortress.policy.dto.PolicyVersionSummary;
import com.grcfortress.policy.dto.StepMessageDto;
import com.grcfortress.policy.dto.TeamMemberDto;
import com.grcfortress.user.UserRepository;

@Service
@Transactional
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final PolicyVersionRepository versionRepository;
    private final PolicyVersionFileRepository versionFileRepository;
    private final PolicyApprovalCycleRepository cycleRepository;
    private final PolicyApprovalStepRepository stepRepository;
    private final PolicyStepMessageRepository messageRepository;
    private final DepartmentRepository departmentRepository;
    private final DepartmentStakeholderRepository stakeholderRepository;
    private final PolicyFileService fileService;
    private final UserRepository userRepository;

    public PolicyService(PolicyRepository policyRepository,
                         PolicyVersionRepository versionRepository,
                         PolicyVersionFileRepository versionFileRepository,
                         PolicyApprovalCycleRepository cycleRepository,
                         PolicyApprovalStepRepository stepRepository,
                         PolicyStepMessageRepository messageRepository,
                         DepartmentRepository departmentRepository,
                         DepartmentStakeholderRepository stakeholderRepository,
                         PolicyFileService fileService,
                         UserRepository userRepository) {
        this.policyRepository = policyRepository;
        this.versionRepository = versionRepository;
        this.versionFileRepository = versionFileRepository;
        this.cycleRepository = cycleRepository;
        this.stepRepository = stepRepository;
        this.messageRepository = messageRepository;
        this.departmentRepository = departmentRepository;
        this.stakeholderRepository = stakeholderRepository;
        this.fileService = fileService;
        this.userRepository = userRepository;
    }

    // ── List ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PolicyListItem> listPolicies() {
        return policyRepository.findAllByDocumentTypeOrderByUpdatedAtDesc(DocumentType.POLICY).stream()
                .map(p -> toPolicyListItem(p, versionRepository.findTopByPolicyIdOrderByCreatedAtDesc(p.getId()).orElse(null),
                        versionRepository.countByPolicyId(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PolicyListItem> listProcedures() {
        return policyRepository.findAllByDocumentTypeOrderByUpdatedAtDesc(DocumentType.PROCEDURE).stream()
                .map(p -> toPolicyListItem(p, versionRepository.findTopByPolicyIdOrderByCreatedAtDesc(p.getId()).orElse(null),
                        versionRepository.countByPolicyId(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PolicyDetail getPolicy(Long policyId, String currentUsername) {
        Policy policy = requirePolicy(policyId);
        List<PolicyVersionSummary> versions = versionRepository
                .findAllByPolicyIdOrderByCreatedAtDesc(policyId).stream()
                .map(v -> toVersionSummary(v, currentUsername))
                .toList();
        Department dept = policy.getDepartment();
        return new PolicyDetail(policy.getId(), policy.getPolicyNumber(), policy.getTitle(),
                policy.getDescription(), policy.getCategory(), policy.getStatus(),
                versions, policy.getCreatedAt(), policy.getUpdatedAt(), policy.getCreatedBy(),
                dept != null ? dept.getId() : null,
                dept != null ? dept.getName() : null,
                policy.getProduct(),
                policy.getWorkflowFileName(), policy.getWorkflowFilePath(),
                policy.getSlaFileName(), policy.getSlaFilePath());
    }

    // ── Upload ──────────────────────────────────────────────────────────────

    public PolicyListItem uploadPolicy(MultipartFile[] files,
                                       String title,
                                       String description,
                                       String category,
                                       String changeReason,
                                       String changeSummary,
                                       Long previousVersionId,
                                       Long departmentId,
                                       String product,
                                       String currentUsername) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("At least one file is required");
        }

        // Determine policy and version number
        Policy policy;
        String versionNumber;
        Long prevVersionRef = null;

        if (previousVersionId != null) {
            PolicyVersion prev = versionRepository.findById(previousVersionId)
                    .orElseThrow(() -> new IllegalArgumentException("Previous version not found: " + previousVersionId));
            policy = prev.getPolicy();
            policy.setTitle(title.strip());
            policy.setDescription(description);
            policy.setCategory(category);
            versionNumber = bumpVersion(prev.getVersionNumber());
            prevVersionRef = previousVersionId;
        } else {
            String policyNumber = generatePolicyNumber();
            policy = new Policy(title.strip(), policyNumber, description, category, DocumentType.POLICY);
            policy = policyRepository.save(policy);
            versionNumber = "1.0";
        }

        // Optional attributes
        if (departmentId != null) {
            policy.setDepartment(departmentRepository.findById(departmentId).orElse(null));
        }
        if (product != null && !product.isBlank()) {
            policy.setProduct(product.strip());
        }

        // Create version record (no file fields — stored in policy_version_files)
        PolicyVersion version = new PolicyVersion(policy, versionNumber, changeReason, changeSummary, prevVersionRef);
        version = versionRepository.save(version);

        // Store each file and create a PolicyVersionFile record
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;
            String relativePath = fileService.store(file, policy.getId());
            String fileType = PolicyFileService.detectFileType(file.getOriginalFilename());
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file-" + (i + 1);
            versionFileRepository.save(new PolicyVersionFile(version, fileName, relativePath, fileType, file.getSize(), i));
        }

        // Determine pre-approval need
        Optional<DepartmentStakeholder> uploaderStakeholder =
                stakeholderRepository.findByEmailUsernameIgnoreCase(currentUsername);

        boolean needsPreApproval = false;
        if (uploaderStakeholder.isPresent() && !uploaderStakeholder.get().isHead()) {
            Long deptId = uploaderStakeholder.get().getDepartment().getId();
            Optional<DepartmentStakeholder> deptHead =
                    stakeholderRepository.findByDepartmentIdAndIsHeadTrue(deptId);
            if (deptHead.isPresent()) {
                version.setPreApprovalRequired(true);
                version.setPreApprovalStakeholderId(deptHead.get().getId());
                version.setStatus(PolicyVersionStatus.PENDING_PRE_APPROVAL);
                policy.setStatus(PolicyStatus.PENDING_PRE_APPROVAL);
                needsPreApproval = true;
            }
        }

        if (!needsPreApproval) {
            launchApprovalCycle(version, policy);
        }

        Policy saved = policyRepository.save(policy);
        long count = versionRepository.countByPolicyId(saved.getId());
        return toPolicyListItem(saved, version, count);
    }

    // ── Procedure upload ────────────────────────────────────────────────────

    public PolicyListItem uploadProcedure(MultipartFile[] files,
                                          String title,
                                          String description,
                                          String category,
                                          String changeReason,
                                          String changeSummary,
                                          Long previousVersionId,
                                          Long departmentId,
                                          String product,
                                          MultipartFile workflowFile,
                                          MultipartFile slaFile,
                                          String currentUsername) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("At least one procedure document is required");
        }

        Policy policy;
        String versionNumber;
        Long prevVersionRef = null;

        if (previousVersionId != null) {
            PolicyVersion prev = versionRepository.findById(previousVersionId)
                    .orElseThrow(() -> new IllegalArgumentException("Previous version not found"));
            policy = prev.getPolicy();
            policy.setTitle(title.strip());
            policy.setDescription(description);
            policy.setCategory(category);
            versionNumber = bumpVersion(prev.getVersionNumber());
            prevVersionRef = previousVersionId;
        } else {
            String docNumber = generateProcedureNumber();
            policy = new Policy(title.strip(), docNumber, description, category, DocumentType.PROCEDURE);
            policy = policyRepository.save(policy);
            versionNumber = "1.0";
        }

        if (departmentId != null) {
            policy.setDepartment(departmentRepository.findById(departmentId).orElse(null));
        }
        if (product != null && !product.isBlank()) {
            policy.setProduct(product.strip());
        }

        // Store optional workflow and SLA files at the procedure level
        if (workflowFile != null && !workflowFile.isEmpty()) {
            String relPath = fileService.store(workflowFile, policy.getId());
            String name = workflowFile.getOriginalFilename() != null ? workflowFile.getOriginalFilename() : "workflow";
            policy.setWorkflowFileName(name);
            policy.setWorkflowFilePath(relPath);
        }
        if (slaFile != null && !slaFile.isEmpty()) {
            String relPath = fileService.store(slaFile, policy.getId());
            String name = slaFile.getOriginalFilename() != null ? slaFile.getOriginalFilename() : "sla";
            policy.setSlaFileName(name);
            policy.setSlaFilePath(relPath);
        }

        PolicyVersion version = new PolicyVersion(policy, versionNumber, changeReason, changeSummary, prevVersionRef);
        version = versionRepository.save(version);

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;
            String relativePath = fileService.store(file, policy.getId());
            String fileType = PolicyFileService.detectFileType(file.getOriginalFilename());
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file-" + (i + 1);
            versionFileRepository.save(new PolicyVersionFile(version, fileName, relativePath, fileType, file.getSize(), i));
        }

        Optional<DepartmentStakeholder> uploaderStakeholder =
                stakeholderRepository.findByEmailUsernameIgnoreCase(currentUsername);
        boolean needsPreApproval = false;
        if (uploaderStakeholder.isPresent() && !uploaderStakeholder.get().isHead()) {
            Long deptId = uploaderStakeholder.get().getDepartment().getId();
            Optional<DepartmentStakeholder> deptHead =
                    stakeholderRepository.findByDepartmentIdAndIsHeadTrue(deptId);
            if (deptHead.isPresent()) {
                version.setPreApprovalRequired(true);
                version.setPreApprovalStakeholderId(deptHead.get().getId());
                version.setStatus(PolicyVersionStatus.PENDING_PRE_APPROVAL);
                policy.setStatus(PolicyStatus.PENDING_PRE_APPROVAL);
                needsPreApproval = true;
            }
        }
        if (!needsPreApproval) {
            launchApprovalCycle(version, policy);
        }

        Policy saved = policyRepository.save(policy);
        long count = versionRepository.countByPolicyId(saved.getId());
        return toPolicyListItem(saved, version, count);
    }

    // ── Pre-approval ────────────────────────────────────────────────────────

    public void preApprove(Long versionId, String comments, String currentUsername) {
        PolicyVersion version = requireVersion(versionId);
        if (version.getStatus() != PolicyVersionStatus.PENDING_PRE_APPROVAL) {
            throw new IllegalStateException("Version is not awaiting pre-approval");
        }
        assertIsPreApprover(version, currentUsername);

        version.setPreApprovalStatus("APPROVED");
        version.setPreApprovalComments(comments);
        version.setPreApprovalDecidedAt(Instant.now());
        versionRepository.save(version);

        launchApprovalCycle(version, version.getPolicy());
        policyRepository.save(version.getPolicy());
    }

    public void preReject(Long versionId, String comments, String currentUsername) {
        PolicyVersion version = requireVersion(versionId);
        if (version.getStatus() != PolicyVersionStatus.PENDING_PRE_APPROVAL) {
            throw new IllegalStateException("Version is not awaiting pre-approval");
        }
        assertIsPreApprover(version, currentUsername);

        version.setPreApprovalStatus("REJECTED");
        version.setPreApprovalComments(comments);
        version.setPreApprovalDecidedAt(Instant.now());
        version.setStatus(PolicyVersionStatus.REJECTED);
        versionRepository.save(version);

        Policy policy = version.getPolicy();
        policy.setStatus(PolicyStatus.REJECTED);
        policyRepository.save(policy);
    }

    // ── Approval cycle ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Optional<ApprovalCycleDetail> getCycle(Long versionId, String currentUsername) {
        return cycleRepository.findByPolicyVersionId(versionId)
                .map(cycle -> toCycleDetail(cycle, currentUsername));
    }

    public void approveStep(Long stepId, String comments, String currentUsername) {
        PolicyApprovalStep step = requireStep(stepId);
        assertIsActiveActor(step, currentUsername);

        step.setDecision("APPROVED");
        step.setComments(comments);
        step.setDecidedAt(Instant.now());
        step.setStatus(StepStatus.APPROVED);
        stepRepository.save(step);

        advanceCycle(step.getCycle());
    }

    public void rejectStep(Long stepId, String comments, String currentUsername) {
        PolicyApprovalStep step = requireStep(stepId);
        assertIsActiveActor(step, currentUsername);

        step.setDecision("REJECTED");
        step.setComments(comments);
        step.setDecidedAt(Instant.now());
        step.setStatus(StepStatus.REJECTED);
        stepRepository.save(step);

        PolicyApprovalCycle cycle = step.getCycle();
        cycle.setStatus(CycleStatus.COMPLETED_REJECTED);
        cycle.setCompletedAt(Instant.now());
        cycleRepository.save(cycle);

        PolicyVersion version = cycle.getPolicyVersion();
        version.setStatus(PolicyVersionStatus.REJECTED);
        versionRepository.save(version);

        Policy policy = version.getPolicy();
        policy.setStatus(PolicyStatus.REJECTED);
        policyRepository.save(policy);
    }

    public void delegateStep(Long stepId, Long delegateStakeholderId, String currentUsername) {
        PolicyApprovalStep step = requireStep(stepId);

        if (step.getStatus() != StepStatus.ACTIVE) {
            throw new IllegalStateException("Step is not currently active");
        }
        // Only the original assigned head can delegate
        if (!step.getAssignedTo().getEmailUsername().equalsIgnoreCase(currentUsername)) {
            throw new AccessDeniedException("Only the originally assigned stakeholder can delegate");
        }

        DepartmentStakeholder delegatee = stakeholderRepository.findById(delegateStakeholderId)
                .orElseThrow(() -> new IllegalArgumentException("Stakeholder not found: " + delegateStakeholderId));
        if (!delegatee.getDepartment().getId().equals(step.getDepartment().getId())) {
            throw new IllegalArgumentException("Delegatee must belong to the same department");
        }

        step.setDelegatedTo(delegatee);
        stepRepository.save(step);
    }

    // ── Discussion thread ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StepMessageDto> getMessages(Long stepId) {
        return messageRepository.findByStepIdOrderByCreatedAtAsc(stepId).stream()
                .map(m -> new StepMessageDto(m.getId(), m.getAuthorUsername(), m.getAuthorName(),
                        m.getMessage(), m.getCreatedAt()))
                .toList();
    }

    public StepMessageDto postMessage(Long stepId, String message, String currentUsername) {
        PolicyApprovalStep step = requireStep(stepId);
        String authorName = userRepository.findByUsernameIgnoreCase(currentUsername)
                .map(u -> u.getFullName())
                .orElse(currentUsername);
        PolicyStepMessage msg = new PolicyStepMessage(step, currentUsername, authorName, message);
        msg = messageRepository.save(msg);
        return new StepMessageDto(msg.getId(), msg.getAuthorUsername(), msg.getAuthorName(),
                msg.getMessage(), msg.getCreatedAt());
    }

    // ── Internal helpers ────────────────────────────────────────────────────

    private void launchApprovalCycle(PolicyVersion version, Policy policy) {
        List<Department> depts = departmentRepository.findAllByOrderBySortOrderAsc();
        List<Department> deptsWithHead = depts.stream()
                .filter(d -> stakeholderRepository.findByDepartmentIdAndIsHeadTrue(d.getId()).isPresent())
                .toList();

        if (deptsWithHead.isEmpty()) {
            // No department heads configured — auto-approve
            version.setStatus(PolicyVersionStatus.APPROVED);
            policy.setStatus(PolicyStatus.APPROVED);
            policy.setCurrentVersionId(version.getId());
            versionRepository.save(version);
            return;
        }

        PolicyApprovalCycle cycle = new PolicyApprovalCycle(version);
        cycle = cycleRepository.save(cycle);

        int order = 1;
        for (Department dept : deptsWithHead) {
            DepartmentStakeholder head =
                    stakeholderRepository.findByDepartmentIdAndIsHeadTrue(dept.getId()).orElseThrow();
            StepStatus stepStatus = (order == 1) ? StepStatus.ACTIVE : StepStatus.PENDING;
            PolicyApprovalStep step = new PolicyApprovalStep(cycle, dept, order, head, stepStatus);
            if (order == 1) step.setActivatedAt(Instant.now());
            stepRepository.save(step);
            order++;
        }

        version.setStatus(PolicyVersionStatus.IN_APPROVAL_CYCLE);
        policy.setStatus(PolicyStatus.IN_APPROVAL_CYCLE);
        versionRepository.save(version);
    }

    private void advanceCycle(PolicyApprovalCycle cycle) {
        List<PolicyApprovalStep> steps = stepRepository.findByCycleIdOrderByStepOrderAsc(cycle.getId());
        Optional<PolicyApprovalStep> next = steps.stream()
                .filter(s -> s.getStatus() == StepStatus.PENDING)
                .findFirst();

        if (next.isPresent()) {
            next.get().setStatus(StepStatus.ACTIVE);
            next.get().setActivatedAt(Instant.now());
            stepRepository.save(next.get());
            cycle.setCurrentStepOrder(next.get().getStepOrder());
            cycleRepository.save(cycle);
        } else {
            cycle.setStatus(CycleStatus.COMPLETED_APPROVED);
            cycle.setCompletedAt(Instant.now());
            cycleRepository.save(cycle);

            PolicyVersion version = cycle.getPolicyVersion();
            version.setStatus(PolicyVersionStatus.APPROVED);
            versionRepository.save(version);

            Policy policy = version.getPolicy();
            if (policy.getCurrentVersionId() != null
                    && !policy.getCurrentVersionId().equals(version.getId())) {
                versionRepository.findById(policy.getCurrentVersionId()).ifPresent(prev -> {
                    prev.setStatus(PolicyVersionStatus.SUPERSEDED);
                    versionRepository.save(prev);
                });
            }
            policy.setStatus(PolicyStatus.APPROVED);
            policy.setCurrentVersionId(version.getId());
            policyRepository.save(policy);
        }
    }

    private void assertIsPreApprover(PolicyVersion version, String currentUsername) {
        if (version.getPreApprovalStakeholderId() == null) {
            throw new AccessDeniedException("No pre-approver assigned");
        }
        DepartmentStakeholder approver = stakeholderRepository
                .findById(version.getPreApprovalStakeholderId()).orElseThrow();
        if (!approver.getEmailUsername().equalsIgnoreCase(currentUsername)) {
            throw new AccessDeniedException("You are not the designated pre-approver");
        }
    }

    private void assertIsActiveActor(PolicyApprovalStep step, String currentUsername) {
        if (step.getStatus() != StepStatus.ACTIVE) {
            throw new IllegalStateException("Step is not currently active");
        }
        DepartmentStakeholder actor = step.getDelegatedTo() != null
                ? step.getDelegatedTo()
                : step.getAssignedTo();
        if (actor == null || !actor.getEmailUsername().equalsIgnoreCase(currentUsername)) {
            throw new AccessDeniedException("You are not the active approver for this step");
        }
    }

    // ── Mappers ─────────────────────────────────────────────────────────────

    private PolicyListItem toPolicyListItem(Policy p, PolicyVersion latest, long count) {
        Department dept = p.getDepartment();
        return new PolicyListItem(
                p.getId(), p.getPolicyNumber(), p.getTitle(), p.getCategory(), p.getStatus(),
                latest != null ? latest.getVersionNumber() : null,
                latest != null ? latest.getId() : null,
                count, p.getCreatedAt(), p.getUpdatedAt(), p.getCreatedBy(),
                dept != null ? dept.getId() : null,
                dept != null ? dept.getName() : null,
                p.getProduct(),
                p.getWorkflowFileName(),
                p.getSlaFileName());
    }

    private PolicyVersionSummary toVersionSummary(PolicyVersion v, String currentUsername) {
        final boolean isPreApprover;
        final String preApproverName;
        if (v.getPreApprovalStakeholderId() != null) {
            Optional<DepartmentStakeholder> approver =
                    stakeholderRepository.findById(v.getPreApprovalStakeholderId());
            isPreApprover = approver
                    .map(a -> a.getEmailUsername().equalsIgnoreCase(currentUsername))
                    .orElse(false);
            preApproverName = approver
                    .map(a -> a.getFirstName() + " " + a.getLastName())
                    .orElse(null);
        } else {
            isPreApprover = false;
            preApproverName = null;
        }
        List<com.grcfortress.policy.dto.PolicyVersionFileDto> fileDtos = versionFileRepository
                .findAllByVersionIdOrderBySortOrderAsc(v.getId()).stream()
                .map(f -> new com.grcfortress.policy.dto.PolicyVersionFileDto(
                        f.getId(), f.getFileName(), f.getFileType(), f.getFileSizeBytes(), f.getSortOrder()))
                .toList();
        return new PolicyVersionSummary(
                v.getId(), v.getPolicy().getId(), v.getVersionNumber(), fileDtos,
                v.getChangeReason(), v.getChangeSummary(),
                v.getPreviousVersionId(), v.getStatus(), v.isPreApprovalRequired(),
                v.getPreApprovalStatus(), preApproverName, isPreApprover,
                v.getCreatedAt(), v.getCreatedBy());
    }

    private ApprovalCycleDetail toCycleDetail(PolicyApprovalCycle cycle, String currentUsername) {
        List<ApprovalStepDetail> stepDetails = stepRepository
                .findByCycleIdOrderByStepOrderAsc(cycle.getId()).stream()
                .map(s -> toStepDetail(s, currentUsername))
                .toList();
        return new ApprovalCycleDetail(cycle.getId(), cycle.getStatus(), cycle.getCurrentStepOrder(),
                cycle.getInitiatedAt(), cycle.getCompletedAt(), stepDetails);
    }

    private ApprovalStepDetail toStepDetail(PolicyApprovalStep step, String currentUsername) {
        DepartmentStakeholder assigned = step.getAssignedTo();
        DepartmentStakeholder delegated = step.getDelegatedTo();

        DepartmentStakeholder activeActor = delegated != null ? delegated : assigned;
        boolean isActiveActor = step.getStatus() == StepStatus.ACTIVE
                && activeActor != null
                && activeActor.getEmailUsername().equalsIgnoreCase(currentUsername);

        // Team members for delegation dropdown (only non-head members of this dept)
        List<TeamMemberDto> teamMembers = List.of();
        if (step.getStatus() == StepStatus.ACTIVE
                && assigned != null
                && assigned.getEmailUsername().equalsIgnoreCase(currentUsername)
                && delegated == null) {
            teamMembers = stakeholderRepository
                    .findAllByDepartmentIdAndIdNot(step.getDepartment().getId(), assigned.getId())
                    .stream()
                    .map(s -> new TeamMemberDto(s.getId(), s.getPositionTitle(),
                            s.getFirstName(), s.getLastName(), s.getEmailUsername()))
                    .toList();
        }

        List<StepMessageDto> messages = messageRepository
                .findByStepIdOrderByCreatedAtAsc(step.getId()).stream()
                .map(m -> new StepMessageDto(m.getId(), m.getAuthorUsername(), m.getAuthorName(),
                        m.getMessage(), m.getCreatedAt()))
                .toList();

        return new ApprovalStepDetail(
                step.getId(), step.getStepOrder(),
                step.getDepartment().getName(), step.getDepartment().getId(),
                assigned != null ? assigned.getFirstName() + " " + assigned.getLastName() : null,
                assigned != null ? assigned.getEmailUsername() : null,
                assigned != null ? assigned.getId() : null,
                delegated != null ? delegated.getFirstName() + " " + delegated.getLastName() : null,
                delegated != null ? delegated.getEmailUsername() : null,
                delegated != null ? delegated.getId() : null,
                step.getStatus(), step.getDecision(), step.getComments(), step.getDecidedAt(),
                isActiveActor, teamMembers, messages);
    }

    private String generatePolicyNumber() {
        int year = Year.now().getValue();
        long count = policyRepository.countByDocumentType(DocumentType.POLICY);
        return String.format("POL-%d-%04d", year, count + 1);
    }

    private String generateProcedureNumber() {
        int year = Year.now().getValue();
        long count = policyRepository.countByDocumentType(DocumentType.PROCEDURE);
        return String.format("PRC-%d-%04d", year, count + 1);
    }

    private static String bumpVersion(String version) {
        try {
            String[] parts = version.split("\\.");
            int major = Integer.parseInt(parts[0]);
            return (major + 1) + ".0";
        } catch (Exception e) {
            return version + "-rev";
        }
    }

    private Policy requirePolicy(Long id) {
        return policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));
    }

    private PolicyVersion requireVersion(Long id) {
        return versionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Version not found: " + id));
    }

    private PolicyApprovalStep requireStep(Long id) {
        return stepRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Approval step not found: " + id));
    }
}
