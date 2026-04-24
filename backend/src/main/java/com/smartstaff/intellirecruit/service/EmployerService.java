package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.employer.EmployerDto;
import com.smartstaff.intellirecruit.dto.employer.EmployerUpdateRequest;
import com.smartstaff.intellirecruit.entity.Employer;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.DuplicateResourceException;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.exception.UnauthorizedAccessException;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployerService {
    @Autowired
    private EmployerRepository employerRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public EmployerDto createProfile(Long userId, EmployerUpdateRequest request) {
        if(employerRepository.existsByUserId(userId)) {
            throw new DuplicateResourceException("Employer profile already exists for user: " + userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Employer employer = Employer.builder()
                .user(user)
                .companyName(request.getCompanyName())
                .industry(request.getIndustry())
                .website(request.getWebsite())
                .build();

        return toDto(employerRepository.save(employer));
    }

    @Transactional(readOnly = true)
    public EmployerDto getById(Long id) {
        return toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public EmployerDto getByUserId(Long userId) {
        return toDto(employerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer profile not found for user: " + userId)));
    }

    @Transactional(readOnly = true)
    public List<EmployerDto> getAll() {
        return employerRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployerDto update(Long id, EmployerUpdateRequest request) {
        Employer employer = findById(id);
        verifyOwnershipOrAdmin(employer.getUser().getEmail());

        if (request.getCompanyName() != null) employer.setCompanyName(request.getCompanyName());
        if (request.getIndustry() != null) employer.setIndustry(request.getIndustry());
        if (request.getWebsite() != null) employer.setWebsite(request.getWebsite());

        return toDto(employerRepository.save(employer));
    }

    @Transactional
    public void delete(Long id) {
        if (!employerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employer", id);
        }
        employerRepository.deleteById(id);
    }


    // ------------ Helpers ---------------------------------------------------------

    private void verifyOwnershipOrAdmin(String ownerEmail) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = currentEmail.equals(ownerEmail);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedAccessException("You are not allowed to modify this resource");
        }
    }

    public Employer findById(Long id) {
        return employerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", id));
    }

    public EmployerDto toDto(Employer e) {
        return EmployerDto.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .name(e.getUser().getName())
                .email(e.getUser().getEmail())
                .companyName(e.getCompanyName())
                .industry(e.getIndustry())
                .website(e.getWebsite())
                .build();
    }
}
