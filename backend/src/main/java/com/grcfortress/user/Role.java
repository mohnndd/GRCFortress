package com.grcfortress.user;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uuid", unique = true, nullable = false, updatable = false, columnDefinition = "uuid")
    private UUID uuid;


    public UUID getUuid() { return uuid; }

    @PrePersist
    private void assignUuid() {
        if (uuid == null) uuid = UUID.randomUUID();
    }

    @Column(name = "name", nullable = false, unique = true, length = 64)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem = false;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    protected Role() {}

    public Role(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean system) { isSystem = system; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
