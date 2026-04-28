package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.application.ApplicationDto;
import com.smartstaff.intellirecruit.entity.Application;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CandidateRepository candidateRepository;

    // Candidate: apply to a vacancy
    @PostMapping("/vacancy/{vacancyId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApplicationDto> apply(@PathVariable Long vacancyId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = getUser(email);
        Long candidateId = getCandidateId(user.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(applicationService.apply(candidateId, vacancyId));
    }

    // Candidate: get own applications
    @GetMapping("/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<List<ApplicationDto>> getMyApplications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = getUser(email);
        Long candidateId = getCandidateId(user.getId());

        return ResponseEntity.ok(applicationService.getByCandidate(candidateId));
    }

    // Candidate: withdraw an application
    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<Void> withdraw(@PathVariable Long id) {
        applicationService.withdraw(id);
        return ResponseEntity.noContent().build();
    }

    // Employer/Admin: get all applications for a vacancy
    @GetMapping("/vacancy/{vacancyId}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<List<ApplicationDto>> getByVacancy(@PathVariable Long vacancyId) {
        return ResponseEntity.ok(applicationService.getByVacancy(vacancyId));
    }

    // Employer/Admin: filter applications by status
    @GetMapping("/vacancy/{vacancyId}/status")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<List<ApplicationDto>> getByVacancyAndStatus(@PathVariable Long vacancyId, @RequestParam Application.Status status) {
        return ResponseEntity.ok(applicationService.getByVacancyAndStatus(vacancyId, status));
    }

    // Admin: get all applications of a candidate
    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ApplicationDto>> getByCandidate(@PathVariable Long candidateId) {
        return ResponseEntity.ok(applicationService.getByCandidate(candidateId));
    }

    // Employer/Admin: update application status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<ApplicationDto> updateStatus(@PathVariable Long id, @RequestParam Application.Status status) {
        return ResponseEntity.ok(applicationService.updateStatus(id, status));
    }


    // ---------- Helpers -------------------------------------------------

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Long getCandidateId(Long userId) {
        return candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Candidate profile not found. Please create your profile first."))
                .getId();
    }
}
