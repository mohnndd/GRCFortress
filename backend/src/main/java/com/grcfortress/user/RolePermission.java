package com.grcfortress.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "role_permissions")
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod = "ANY";

    @Column(name = "path_pattern", nullable = false, length = 300)
    private String pathPattern;

    @Column(length = 200)
    private String label;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public RolePermission() {}

    public Long getId() { return id; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }
    public String getPathPattern() { return pathPattern; }
    public void setPathPattern(String pathPattern) { this.pathPattern = pathPattern; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Instant getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
