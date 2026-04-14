package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployerRepository extends JpaRepository<Employer, Long> {
    Optional<Employer> findByUserId(Long userId);

    List<Employer> findByIndustry(String industry);

    boolean existsByUserId(Long userId);
}
