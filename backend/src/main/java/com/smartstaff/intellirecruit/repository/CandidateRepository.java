package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByUserId(Long userId);

    // Find by minimum experience — useful for AI recommendation filtering
    List<Candidate> findByExperienceYearsGreaterThanEqual(Integer years);

    // Keyword search in skills or bio (case-insensitive)
    @Query("SELECT c FROM Candidate c WHERE " +
            "LOWER(c.skills) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.bio) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Candidate> searchByKeyword(@Param("keyword") String keyword);

    // Used by AI recommendation: available candidates with minimum experience
    @Query("SELECT c FROM Candidate c WHERE c.isAvailable = true " +
            "AND c.experienceYears >= :minYears")
    List<Candidate> findAvailableWithMinExperience(@Param("minYears") int minYears);

    List<Candidate> findByIsAvailableTrue();
}
