package com.grcfortress.observation;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.circular.Circular;
import com.grcfortress.circular.CircularRepository;
import com.grcfortress.department.Department;
import com.grcfortress.department.DepartmentRepository;
import com.grcfortress.department.DepartmentStakeholder;
import com.grcfortress.department.DepartmentStakeholderRepository;
import com.grcfortress.observation.dto.ClosureRequestDto;
import com.grcfortress.observation.dto.ConfirmDateRequest;
import com.grcfortress.observation.dto.ObservationDetail;
import com.grcfortress.observation.dto.ObservationListItem;
import com.grcfortress.observation.dto.ObservationMessageDto;

@Service
@Transactional
public class ObservationService {

    private final ObservationRepository observationRepository;
    private final ObservationMessageRepository messageRepository;
    private final ObservationClosureRequestRepository closureRequestRepository;
    private final ObservationFileService fileService;
    private final DepartmentStakeholderRepository stakeholderRepository;
    private final DepartmentRepository departmentRepository;
    private final CircularRepository circularRepository;

    public ObservationService(
            ObservationRepository observationRepository,
            ObservationMessageRepository messageRepository,
            ObservationClosureRequestRepository closureRequestRepository,
            ObservationFileService fileService,
            DepartmentStakeholderRepository stakeholderRepository,
            DepartmentRepository departmentRepository,
            CircularRepository circularRepository) {
        this.observationRepository = observationRepository;
        this.messageRepository = messageRepository;
        this.closureRequestRepository = closureRequestRepository;
        this.fileService = fileService;
        this.stakeholderRepository = stakeholderRepository;
        this.departmentRepository = departmentRepository;
        this.circularRepository = circularRepository;
    }

    @Transactional(readOnly = true)
    public List<ObservationListItem> listAll() {
        return observationRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ObservationListItem> listForUser(String username) {
        Optional<DepartmentStakeholder> stakeholderOpt =
                stakeholderRepository.findByEmailUsernameIgnoreCase(username);
        if (stakeholderOpt.isEmpty()) {
            return listAll();
        }
        Long deptId = stakeholderOpt.get().getDepartment().getId();
        return observationRepository
                .findAllByCreatorDepartmentIdOrReceivingDepartmentIdOrderByUpdatedAtDesc(deptId, deptId)
                .stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public ObservationDetail getObservation(Long id, String currentUsername) {
        Observation obs = loadObservation(id);
        return toDetail(obs, currentUsername);
    }

    public ObservationListItem createObservation(
            MultipartFile regulationFile,
            String name,
            String description,
            String controlViolation,
            boolean isRegulationRelated,
            LocalDate proposedTargetDate,
            Long receivingDepartmentId,
            Long linkedCircularId,
            String currentUsername) {

        DepartmentStakeholder stakeholder = stakeholderRepository
                .findByEmailUsernameIgnoreCase(currentUsername)
                .orElseThrow(() -> new IllegalStateException(
                        "No stakeholder record found for user: " + currentUsername));

        Department creatorDept = stakeholder.getDepartment();
        Department receivingDept = departmentRepository.findById(receivingDepartmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Receiving department not found: " + receivingDepartmentId));

        int year = Year.now().getValue();
        long count = observationRepository.count();
        String obsNumber = "OBS-" + year + "-" + String.format("%04d", count + 1);

        Observation obs = new Observation(obsNumber, name, creatorDept, receivingDept);
        obs.setDescription(description);
        obs.setControlViolation(controlViolation);
        obs.setRegulationRelated(isRegulationRelated);
        obs.setProposedTargetDate(proposedTargetDate);
        obs.setStatus(ObservationStatus.OPEN);

        if (linkedCircularId != null) {
            Circular circular = circularRepository.findById(linkedCircularId).orElse(null);
            obs.setLinkedCircular(circular);
        }

        // Save first so we have an id for file storage
        obs = observationRepository.save(obs);

        if (regulationFile != null && !regulationFile.isEmpty()) {
            String relativePath = fileService.store(regulationFile, obs.getId());
            obs.setRegulationFilePath(relativePath);
            obs.setRegulationFileName(regulationFile.getOriginalFilename());
            obs = observationRepository.save(obs);
        }

        return toListItem(obs);
    }

    public void confirmTargetDate(Long id, ConfirmDateRequest req, String currentUsername) {
        Observation obs = loadObservation(id);
        if (obs.getStatus() != ObservationStatus.OPEN) {
            throw new IllegalStateException("Observation is not in OPEN status");
        }
        // Any member of receiving dept (or admin) can confirm
        checkIsInReceivingDept(obs, currentUsername);

        obs.setConfirmedTargetDate(req.confirmedTargetDate());
        obs.setStatus(ObservationStatus.IN_PROGRESS);
        observationRepository.save(obs);
    }

    public ObservationMessageDto postMessage(Long id, String message, String currentUsername) {
        Observation obs = loadObservation(id);

        String authorName = stakeholderRepository
                .findByEmailUsernameIgnoreCase(currentUsername)
                .map(s -> s.getFirstName() + " " + s.getLastName())
                .orElse(currentUsername);

        ObservationMessage msg = new ObservationMessage(obs, currentUsername, authorName, message);
        msg = messageRepository.save(msg);
        return toMessageDto(msg);
    }

    public void requestClosure(Long id, MultipartFile evidenceFile, String notes, String currentUsername) {
        Observation obs = loadObservation(id);
        if (obs.getStatus() != ObservationStatus.IN_PROGRESS) {
            throw new IllegalStateException("Observation is not IN_PROGRESS; cannot request closure");
        }
        checkIsInReceivingDept(obs, currentUsername);

        ObservationClosureRequest closure = new ObservationClosureRequest(obs, currentUsername);
        closure.setNotes(notes);

        // Save first to get id for file storage
        closure = closureRequestRepository.save(closure);

        if (evidenceFile != null && !evidenceFile.isEmpty()) {
            String relativePath = fileService.store(evidenceFile, obs.getId());
            closure.setEvidenceFilePath(relativePath);
            closure.setEvidenceFileName(evidenceFile.getOriginalFilename());
            closureRequestRepository.save(closure);
        }

        obs.setStatus(ObservationStatus.PENDING_CLOSURE);
        observationRepository.save(obs);
    }

    public void acceptClosure(Long id, String currentUsername) {
        Observation obs = loadObservation(id);
        if (obs.getStatus() != ObservationStatus.PENDING_CLOSURE) {
            throw new IllegalStateException("Observation is not PENDING_CLOSURE");
        }
        checkIsInCreatorDeptOrCreator(obs, currentUsername);

        ObservationClosureRequest closure = closureRequestRepository
                .findTopByObservationIdAndStatusOrderBySubmittedAtDesc(id, "PENDING")
                .orElseThrow(() -> new IllegalStateException("No pending closure request found"));

        closure.setStatus("ACCEPTED");
        closure.setDecidedBy(currentUsername);
        closure.setDecidedAt(Instant.now());
        closureRequestRepository.save(closure);

        obs.setStatus(ObservationStatus.CLOSED);
        observationRepository.save(obs);
    }

    public void rejectClosure(Long id, String rejectionReason, String currentUsername) {
        Observation obs = loadObservation(id);
        if (obs.getStatus() != ObservationStatus.PENDING_CLOSURE) {
            throw new IllegalStateException("Observation is not PENDING_CLOSURE");
        }
        checkIsInCreatorDeptOrCreator(obs, currentUsername);

        ObservationClosureRequest closure = closureRequestRepository
                .findTopByObservationIdAndStatusOrderBySubmittedAtDesc(id, "PENDING")
                .orElseThrow(() -> new IllegalStateException("No pending closure request found"));

        closure.setStatus("REJECTED");
        closure.setRejectionReason(rejectionReason);
        closure.setDecidedBy(currentUsername);
        closure.setDecidedAt(Instant.now());
        closureRequestRepository.save(closure);

        obs.setStatus(ObservationStatus.IN_PROGRESS);
        observationRepository.save(obs);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Observation loadObservation(Long id) {
        return observationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Observation not found: " + id));
    }

    private void checkIsInReceivingDept(Observation obs, String username) {
        Optional<DepartmentStakeholder> s = stakeholderRepository.findByEmailUsernameIgnoreCase(username);
        if (s.isEmpty()) return; // admin — allow
        Long userDeptId = s.get().getDepartment().getId();
        if (!userDeptId.equals(obs.getReceivingDepartment().getId())) {
            throw new IllegalStateException("User is not a member of the receiving department");
        }
    }

    private void checkIsInCreatorDeptOrCreator(Observation obs, String username) {
        if (username.equalsIgnoreCase(obs.getCreatedBy())) return;
        Optional<DepartmentStakeholder> s = stakeholderRepository.findByEmailUsernameIgnoreCase(username);
        if (s.isEmpty()) return; // admin — allow
        Long userDeptId = s.get().getDepartment().getId();
        if (!userDeptId.equals(obs.getCreatorDepartment().getId())) {
            throw new IllegalStateException("User is not a member of the creator department");
        }
    }

    private ObservationListItem toListItem(Observation o) {
        return new ObservationListItem(
                o.getId(),
                o.getObservationNumber(),
                o.getName(),
                o.getStatus(),
                o.getCreatorDepartment().getName(),
                o.getReceivingDepartment().getName(),
                o.getProposedTargetDate(),
                o.getConfirmedTargetDate(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                o.getCreatedBy()
        );
    }

    private ObservationDetail toDetail(Observation o, String currentUsername) {
        List<ObservationMessageDto> messages = messageRepository
                .findAllByObservationIdOrderByCreatedAtAsc(o.getId())
                .stream()
                .map(this::toMessageDto)
                .toList();

        List<ClosureRequestDto> closureRequests = closureRequestRepository
                .findAllByObservationIdOrderBySubmittedAtDesc(o.getId())
                .stream()
                .map(this::toClosureDto)
                .toList();

        boolean inCreator = false;
        boolean inReceiving = false;
        Optional<DepartmentStakeholder> stakeholder =
                stakeholderRepository.findByEmailUsernameIgnoreCase(currentUsername);
        if (stakeholder.isPresent()) {
            Long userDeptId = stakeholder.get().getDepartment().getId();
            inCreator = userDeptId.equals(o.getCreatorDepartment().getId());
            inReceiving = userDeptId.equals(o.getReceivingDepartment().getId());
        }

        Circular linked = o.getLinkedCircular();
        return new ObservationDetail(
                o.getId(),
                o.getObservationNumber(),
                o.getName(),
                o.getStatus(),
                o.getCreatorDepartment().getName(),
                o.getReceivingDepartment().getName(),
                o.getProposedTargetDate(),
                o.getConfirmedTargetDate(),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                o.getCreatedBy(),
                o.getDescription(),
                o.getControlViolation(),
                o.isRegulationRelated(),
                o.getRegulationFileName(),
                o.getRegulationFilePath(),
                linked != null ? linked.getId() : null,
                linked != null ? linked.getCircularNumber() : null,
                linked != null ? linked.getIssuer() : null,
                messages,
                closureRequests,
                inCreator,
                inReceiving
        );
    }

    private ObservationMessageDto toMessageDto(ObservationMessage m) {
        return new ObservationMessageDto(
                m.getId(),
                m.getAuthorUsername(),
                m.getAuthorName(),
                m.getMessage(),
                m.getCreatedAt()
        );
    }

    private ClosureRequestDto toClosureDto(ObservationClosureRequest c) {
        return new ClosureRequestDto(
                c.getId(),
                c.getEvidenceFileName(),
                c.getEvidenceFilePath(),
                c.getNotes(),
                c.getStatus(),
                c.getRejectionReason(),
                c.getSubmittedBy(),
                c.getSubmittedAt(),
                c.getDecidedBy(),
                c.getDecidedAt()
        );
    }
}
