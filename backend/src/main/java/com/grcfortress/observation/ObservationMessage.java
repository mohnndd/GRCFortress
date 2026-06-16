package com.grcfortress.observation;

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
import com.fasterxml.uuid.Generators;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "observation_messages")
public class ObservationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID uuid;


    public UUID getUuid() { return uuid; }

    @PrePersist
    private void assignUuid() {
        if (uuid == null) uuid = Generators.timeBasedEpochGenerator().generate();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "observation_id", nullable = false)
    private Observation observation;

    @Column(name = "author_username", nullable = false, length = 64)
    private String authorUsername;

    @Column(name = "author_name", length = 200)
    private String authorName;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ObservationMessage() {}

    public ObservationMessage(Observation observation, String authorUsername, String authorName, String message) {
        this.observation = observation;
        this.authorUsername = authorUsername;
        this.authorName = authorName;
        this.message = message;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }

    public Observation getObservation() { return observation; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getCreatedAt() { return createdAt; }
}
