package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.employer.EmployerDto;
import com.smartstaff.intellirecruit.dto.employer.EmployerUpdateRequest;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.EmployerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employers")
public class EmployerController {
    @Autowired
    private EmployerService employerService;
    @Autowired
    private UserRepository userRepository;

    // Admin: get all employers
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EmployerDto>> getAll() {
        return ResponseEntity.ok(employerService.getAll());
    }

    // Get employer by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER', 'CANDIDATE')")
    public ResponseEntity<EmployerDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employerService.getById(id));
    }

    // Get own employer profile
    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerDto> getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User " + email));

        return ResponseEntity.ok(employerService.getByUserId(user.getId()));
    }

    // Create employer profile (called after registration)
    @PostMapping("/profile")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerDto> createProfile(@Valid @RequestBody EmployerUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User " + email));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(employerService.createProfile(user.getId(), request));
    }

    // Update employer profile
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<EmployerDto> update(@PathVariable Long id, @RequestBody EmployerUpdateRequest request) {
        return ResponseEntity.ok(employerService.update(id, request));
    }

    // Admin: delete employer
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
