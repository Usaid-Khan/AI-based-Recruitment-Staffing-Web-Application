package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.application.ApplicationDto;
import com.smartstaff.intellirecruit.entity.Application;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.entity.Vacancy;
import com.smartstaff.intellirecruit.exception.DuplicateResourceException;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.exception.UnauthorizedAccessException;
import com.smartstaff.intellirecruit.repository.ApplicationRepository;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.repository.VacancyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private VacancyRepository vacancyRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ApplicationDto apply(Long candidateId, Long vacancyId) {
        if(applicationRepository.existsByCandidateIdAndVacancyId(candidateId, vacancyId)) {
            throw new DuplicateResourceException("You have already applied to this vacancy");
        }

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", candidateId));

        Vacancy vacancy = vacancyRepository.findById(vacancyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy", vacancyId));

        Application application = Application.builder()
                .candidate(candidate)
                .vacancy(vacancy)
                .status(Application.Status.APPLIED)
                .build();

        return toDto(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getByCandidate(Long candidateId) {
        return applicationRepository.findByCandidateId(candidateId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getByVacancy(Long vacancyId) {
        return applicationRepository.findByVacancyId(vacancyId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getByVacancyAndStatus(Long vacancyId, Application.Status status) {
        return applicationRepository.findByVacancyIdAndStatus(vacancyId, status)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public ApplicationDto updateStatus(Long id, Application.Status newStatus) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", id));

        // Only employer who owns the vacancy or admin can update status
        String currentEmail = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String vacancyOwnerEmail = application.getVacancy()
                .getEmployer().getUser().getEmail();

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = currentEmail.equals(vacancyOwnerEmail);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedAccessException("You cannot update this application status");
        }

        application.setStatus(newStatus);
        return toDto(applicationRepository.save(application));
    }

    @Transactional
    public void withdraw(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", id));

        String currentEmail = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        if(application.getCandidate().getUser().getEmail().equals(currentEmail)) {
            throw new UnauthorizedAccessException("You can only withdraw your own applications");
        }

        application.setStatus(Application.Status.WITHDRAWN);
        applicationRepository.save(application);
    }


    // ---------- Helpers ------------------------------------------------

    public ApplicationDto toDto(Application a) {
        return ApplicationDto.builder()
                .id(a.getId())
                .candidateId(a.getCandidate().getId())
                .candidateName(a.getCandidate().getUser().getName())
                .vacancyId(a.getVacancy().getId())
                .vacancyTitle(a.getVacancy().getTitle())
                .status(a.getStatus())
                .appliedAt(a.getAppliedAt())
                .build();
    }
}
