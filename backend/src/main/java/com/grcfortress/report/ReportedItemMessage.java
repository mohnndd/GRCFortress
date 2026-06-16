package com.grcfortress.report;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.uuid.Generators;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "reported_item_messages")
public class ReportedItemMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID uuid;

    @PrePersist
    private void assignUuid() {
        if (uuid == null) uuid = Generators.timeBasedEpochGenerator().generate();
    }

    public UUID getUuid() { return uuid; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_item_id", nullable = false)
    private ReportedItem reportedItem;

    @Column(name = "author_username", nullable = false, length = 64)
    private String authorUsername;

    @Column(name = "message", nullable = false, length = 4000)
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected ReportedItemMessage() {
    }

    public ReportedItemMessage(ReportedItem reportedItem, String authorUsername, String message) {
        this.reportedItem = reportedItem;
        this.authorUsername = authorUsername;
        this.message = message;
    }

    public Long getId() { return id; }
    public String getAuthorUsername() { return authorUsername; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
}
