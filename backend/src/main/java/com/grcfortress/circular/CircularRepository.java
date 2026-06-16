package com.grcfortress.circular;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CircularRepository extends JpaRepository<Circular, Long> {
    List<Circular> findAllByOrderByCreatedAtDesc();
    long count();
}
