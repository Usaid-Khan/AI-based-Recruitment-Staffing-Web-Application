package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.Vacancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VacancyRepository extends JpaRepository<Vacancy, Long> {
    List<Vacancy> findByEmployerId(Long employerId);

    List<Vacancy> findByStatus(Vacancy.Status status);

    List<Vacancy> findByEmployerIdAndStatus(Long employerId, Vacancy.Status status);

    // Full-text search across title, description, requirements
    @Query("SELECT v FROM Vacancy v WHERE v.status = 'OPEN' AND (" +
            "LOWER(v.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(v.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(v.requirements) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Vacancy> searchOpenVacancies(@Param("keyword") String keyword);

    long countByStatus(Vacancy.Status status);
}
