package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.Placement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacementRepository extends JpaRepository<Placement, Long> {
    List<Placement> findByCandidateId(Long cadidateId);

    List<Placement> findByEmployerId(Long employerId);

    List<Placement> findByVacancyId(Long vacancyId);

    boolean existsByCandidateIdAndVacancyId(Long candidateId, Long vacancyId);
}
