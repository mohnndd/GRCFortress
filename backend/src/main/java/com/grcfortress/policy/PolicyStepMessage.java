package com.grcfortress.policy;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_step_messages")
public class PolicyStepMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID uuid;


    public UUID getUuid() { return uuid; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    private PolicyApprovalStep step;

    @Column(name = "author_username", nullable = false, length = 64)
    private String authorUsername;

    @Column(name = "author_name", length = 200)
    private String authorName;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected PolicyStepMessage() {
    }

    public PolicyStepMessage(PolicyApprovalStep step, String authorUsername, String authorName, String message) {
        this.step = step;
        this.authorUsername = authorUsername;
        this.authorName = authorName;
        this.message = message;
    }

    public Long getId() { return id; }
    public PolicyApprovalStep getStep() { return step; }
    public String getAuthorUsername() { return authorUsername; }
    public String getAuthorName() { return authorName; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
}
