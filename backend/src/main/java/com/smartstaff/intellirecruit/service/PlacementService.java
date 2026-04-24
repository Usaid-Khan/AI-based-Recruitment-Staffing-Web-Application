package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.placement.PlacementDto;
import com.smartstaff.intellirecruit.dto.placement.PlacementRequest;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.entity.Employer;
import com.smartstaff.intellirecruit.entity.Placement;
import com.smartstaff.intellirecruit.entity.Vacancy;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.PlacementRepository;
import com.smartstaff.intellirecruit.repository.VacancyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlacementService {
    @Autowired
    private PlacementRepository placementRepository;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private EmployerRepository employerRepository;
    @Autowired
    private VacancyRepository vacancyRepository;

    @Transactional
    public PlacementDto create(PlacementRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", request.getCandidateId()));

        Employer employer = employerRepository.findById(request.getEmployerId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer", request.getEmployerId()));

        Vacancy vacancy = null;
        if (request.getVacancyId() != null) {
            vacancy = vacancyRepository.findById(request.getVacancyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vacancy", request.getVacancyId()));
        }

        Placement placement = Placement.builder()
                .candidate(candidate)
                .employer(employer)
                .vacancy(vacancy)
                .contractUrl(request.getContractUrl())
                .startDate(request.getStartDate())
                .build();

        // Mark candidate as no longer available after placement
        candidate.setIsAvailable(false);
        candidateRepository.save(candidate);

        return toDto(placementRepository.save(placement));
    }

    @Transactional(readOnly = true)
    public PlacementDto getById(Long id) {
        return toDto(placementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Placement", id)));
    }

    @Transactional(readOnly = true)
    public List<PlacementDto> getAll() {
        return placementRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlacementDto> getByCandidate(Long candidateId) {
        return placementRepository.findByCandidateId(candidateId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlacementDto> getByEmployer(Long employerId) {
        return placementRepository.findByEmployerId(employerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public PlacementDto updateContractUrl(Long id, String contractUrl) {
        Placement placement = placementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Placement", id));

        placement.setContractUrl(contractUrl);
        return toDto(placementRepository.save(placement));
    }

    @Transactional
    public void delete(Long id) {
        if (!placementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Placement", id);
        }
        placementRepository.deleteById(id);
    }


    // ---------- Helpers -----------------------------------------------

    public PlacementDto toDto(Placement p) {
        return PlacementDto.builder()
                .id(p.getId())
                .candidateId(p.getCandidate().getId())
                .candidateName(p.getCandidate().getUser().getName())
                .employerId(p.getEmployer().getId())
                .companyName(p.getEmployer().getCompanyName())
                .vacancyId(p.getVacancy() != null ? p.getVacancy().getId() : null)
                .vacancyTitle(p.getVacancy() != null ? p.getVacancy().getTitle() : null)
                .contractUrl(p.getContractUrl())
                .startDate(p.getStartDate())
                .build();
    }
}
