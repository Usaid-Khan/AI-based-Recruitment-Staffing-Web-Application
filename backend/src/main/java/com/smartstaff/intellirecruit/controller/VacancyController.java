package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.vacancy.VacancyDto;
import com.smartstaff.intellirecruit.dto.vacancy.VacancyRequest;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.VacancyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacancies")
public class VacancyController {
    @Autowired
    private VacancyService vacancyService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmployerRepository employerRepository;

    // Public: get all open vacancies
    @GetMapping
    public ResponseEntity<List<VacancyDto>> getOpenVacancies() {
        return ResponseEntity.ok(vacancyService.getOpenVacancies());
    }

    // Public: search vacancies by keyword
    @GetMapping("/search")
    public ResponseEntity<List<VacancyDto>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(vacancyService.search(keyword));
    }

    // Public: get vacancy by ID
    @GetMapping("/{id}")
    public ResponseEntity<VacancyDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vacancyService.getById(id));
    }

    // Get all vacancies for a specific employer
    @GetMapping("/employer/{employerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<List<VacancyDto>> getByEmployer(@PathVariable Long employerId) {
        return ResponseEntity.ok(vacancyService.getByEmployer(employerId));
    }

    // Get own vacancies (employer uses this)
    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<List<VacancyDto>> getMyVacancies() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User " + email));

        Long employerId = getEmployerId(user.getId());

        return ResponseEntity.ok(vacancyService.getByEmployer(employerId));
    }

    // Admin: get all vacancies regardless of status
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VacancyDto>> getAll() {
        return ResponseEntity.ok(vacancyService.getAll());
    }

    // Employer/Admin: create vacancy
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<VacancyDto> create(@Valid @RequestBody VacancyRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = getUser(email);
        Long employerId = getEmployerId(user.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(vacancyService.create(employerId, request));
    }

    // Employer/Admin: update vacancy
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<VacancyDto> update(@PathVariable Long id, @RequestBody VacancyRequest request) {
        return ResponseEntity.ok(vacancyService.update(id, request));
    }

    // Employer/Admin: delete vacancy
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vacancyService.delete(id);
        return ResponseEntity.noContent().build();
    }


    // ---------- Helpers -----------------------------------------------------

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Long getEmployerId(Long userId) {
        return employerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employer profile not found. Please create your profile first."))
                .getId();
    }
}
