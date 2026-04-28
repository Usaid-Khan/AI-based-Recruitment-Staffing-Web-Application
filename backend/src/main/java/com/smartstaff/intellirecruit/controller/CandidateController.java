package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.candidate.CandidateDto;
import com.smartstaff.intellirecruit.dto.candidate.CandidateUpdateRequest;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.CandidateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {
    @Autowired
    private CandidateService candidateService;
    @Autowired
    private UserRepository userRepository;

    // Admin: get all candidates
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CandidateDto>> getAll() {
        return ResponseEntity.ok(candidateService.getAll());
    }

    // Public: get available candidates (for employer shortlisting)
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<List<CandidateDto>> getAvailable() {
        return ResponseEntity.ok(candidateService.getAvailable());
    }

    // Search candidates by keyword
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<List<CandidateDto>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(candidateService.search(keyword));
    }

    // Get candidate by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER', 'CANDIDATE')")
    public ResponseEntity<CandidateDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getById(id));
    }

    // Get own candidate profile (candidate uses this)
    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateDto> getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User " + email));

        return ResponseEntity.ok(candidateService.getByUserId(user.getId()));
    }

    // Create candidate profile (called after registration)
    @PostMapping("/profile")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateDto> createProfile() {
        User user = getUser(SecurityContextHolder.getContext().getAuthentication().getName());
        return ResponseEntity.ok(candidateService.createProfile(user.getId()));
    }

    // Update candidate profile
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CANDIDATE', 'ADMIN')")
    public ResponseEntity<CandidateDto> update(@PathVariable Long id, @RequestBody CandidateUpdateRequest request) {
        return ResponseEntity.ok(candidateService.update(id, request));
    }

    // Upload resume
    @PostMapping("/{id}/resume")
    @PreAuthorize("hasAnyRole('CANDIDATE', 'ADMIN')")
    public ResponseEntity<String> uploadResume(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        String url = candidateService.uploadResume(id, file);
        return ResponseEntity.ok(url);
    }

    // Admin: delete candidate
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        candidateService.delete(id);
        return ResponseEntity.noContent().build();
    }


    // ------------ Helper ----------------------------------------------
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
