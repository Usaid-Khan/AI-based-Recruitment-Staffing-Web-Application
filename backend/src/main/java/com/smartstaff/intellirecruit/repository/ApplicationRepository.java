package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByCandidateId(Long candidateId);

    List<Application> findByVacancyId(Long vacancyId);

    List<Application> findByVacancyIdAndStatus(Long vacancyId, Application.Status status);

    Optional<Application> findByCandidateIdAndVacancyId(Long candidateId, Long vacancyId);

    boolean existsByCandidateIdAndVacancyId(Long candidateId, Long vacancyId);

    long countByVacancyId(Long vacancyId);
}
