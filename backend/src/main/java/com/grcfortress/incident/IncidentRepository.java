package com.grcfortress.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    @Query("""
        SELECT i FROM Incident i
        LEFT JOIN FETCH i.department
        ORDER BY i.createdAt DESC
        """)
    List<Incident> findAllWithDepartment();

    @Query("""
        SELECT i FROM Incident i
        LEFT JOIN FETCH i.department
        LEFT JOIN FETCH i.updates u
        LEFT JOIN FETCH i.linkedObservation
        WHERE i.id = :id
        """)
    Optional<Incident> findByIdWithDetails(Long id);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status NOT IN ('CLOSED','CANCELLED')")
    long countOpen();

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(i.incidentNumber, 4) AS integer)), 0) FROM Incident i WHERE i.incidentNumber LIKE 'INC%'")
    Integer findMaxSequence();
}
