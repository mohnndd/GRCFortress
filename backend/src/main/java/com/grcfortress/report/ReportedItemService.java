package com.grcfortress.report;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.grcfortress.report.dto.ReportedItemDetail;
import com.grcfortress.report.dto.ReportedItemMessageResponse;
import com.grcfortress.report.dto.ReportedItemSummary;

@Service
@Transactional
public class ReportedItemService {

    private final ReportedItemRepository itemRepository;
    private final ReportedItemMessageRepository messageRepository;
    private final ReportedItemFileService fileService;

    public ReportedItemService(ReportedItemRepository itemRepository,
                               ReportedItemMessageRepository messageRepository,
                               ReportedItemFileService fileService) {
        this.itemRepository = itemRepository;
        this.messageRepository = messageRepository;
        this.fileService = fileService;
    }

    @Transactional(readOnly = true)
    public List<ReportedItemSummary> list(String currentUsername, boolean isAdmin) {
        List<ReportedItem> items = isAdmin
                ? itemRepository.findAllByOrderByUpdatedAtDesc()
                : itemRepository.findAllByReporterUsernameIgnoreCaseOrderByUpdatedAtDesc(currentUsername);
        return items.stream().map(this::toSummary).toList();
    }

    public ReportedItemSummary create(ReportType reportType,
                                      String title,
                                      String description,
                                      MultipartFile attachment,
                                      String currentUsername) {
        ReportedItem item = itemRepository.save(new ReportedItem(
                reportType,
                title.strip(),
                description.strip(),
                currentUsername
        ));

        if (attachment != null && !attachment.isEmpty()) {
            String relativePath = fileService.store(attachment, item.getId());
            String originalName = attachment.getOriginalFilename() != null
                    ? attachment.getOriginalFilename()
                    : "attachment";
            item.setAttachment(
                    originalName,
                    relativePath,
                    ReportedItemFileService.detectFileType(originalName),
                    attachment.getSize()
            );
            item = itemRepository.save(item);
        }

        messageRepository.save(new ReportedItemMessage(item, currentUsername, "Report submitted."));
        return toSummary(item);
    }

    @Transactional(readOnly = true)
    public ReportedItemDetail get(Long id, String currentUsername, boolean isAdmin) {
        ReportedItem item = requireAccessible(id, currentUsername, isAdmin);
        return toDetail(item);
    }

    public ReportedItemDetail updateStatus(Long id, ReportedItemStatus status, String currentUsername, boolean isAdmin) {
        if (!isAdmin) {
            throw new AccessDeniedException("Only admins can update report status");
        }
        ReportedItem item = requireAccessible(id, currentUsername, true);
        item.setStatus(status);
        ReportedItem saved = itemRepository.save(item);
        messageRepository.save(new ReportedItemMessage(saved, currentUsername, "Status updated to " + status + "."));
        return toDetail(saved);
    }

    public ReportedItemMessageResponse addMessage(Long id, String message, String currentUsername, boolean isAdmin) {
        ReportedItem item = requireAccessible(id, currentUsername, isAdmin);
        ReportedItemMessage saved = messageRepository.save(new ReportedItemMessage(item, currentUsername, message.strip()));
        return toMessage(saved);
    }

    @Transactional(readOnly = true)
    public ReportedItem requireAccessible(Long id, String currentUsername, boolean isAdmin) {
        ReportedItem item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reported item not found: " + id));
        if (!isAdmin && !item.getReporterUsername().equalsIgnoreCase(currentUsername)) {
            throw new AccessDeniedException("You cannot access this reported item");
        }
        return item;
    }

    private ReportedItemSummary toSummary(ReportedItem item) {
        return new ReportedItemSummary(
                item.getId(),
                item.getReportType(),
                item.getTitle(),
                item.getDescription(),
                item.getStatus(),
                item.getReporterUsername(),
                item.getAttachmentFileName(),
                item.getAttachmentFileType(),
                item.getAttachmentFileSizeBytes(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }

    private ReportedItemDetail toDetail(ReportedItem item) {
        return new ReportedItemDetail(
                item.getId(),
                item.getReportType(),
                item.getTitle(),
                item.getDescription(),
                item.getStatus(),
                item.getReporterUsername(),
                item.getAttachmentFileName(),
                item.getAttachmentFileType(),
                item.getAttachmentFileSizeBytes(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                messageRepository.findAllByReportedItem_IdOrderByCreatedAtAsc(item.getId()).stream()
                        .map(this::toMessage)
                        .toList()
        );
    }

    private ReportedItemMessageResponse toMessage(ReportedItemMessage message) {
        return new ReportedItemMessageResponse(
                message.getId(),
                message.getAuthorUsername(),
                message.getMessage(),
                message.getCreatedAt()
        );
    }
}
