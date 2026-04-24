package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.vacancy.VacancyDto;
import com.smartstaff.intellirecruit.dto.vacancy.VacancyRequest;
import com.smartstaff.intellirecruit.entity.Employer;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.entity.Vacancy;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.exception.UnauthorizedAccessException;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.repository.VacancyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VacancyService {
    @Autowired
    private VacancyRepository vacancyRepository;
    @Autowired
    private EmployerRepository employerRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public VacancyDto create(Long employerId, VacancyRequest request) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));

        Vacancy vacancy = Vacancy.builder()
                .employer(employer)
                .title(request.getTitle())
                .description(request.getDescription())
                .requirements(request.getRequirements())
                .salaryRange(request.getSalaryRange())
                .status(request.getStatus() != null ? request.getStatus() : Vacancy.Status.OPEN)
                .build();

        return toDto(vacancyRepository.save(vacancy));
    }

    @Transactional(readOnly = true)
    public VacancyDto getById(Long id) {
        return toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> getAll() {
        return vacancyRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> getOpenVacancies() {
        return vacancyRepository.findByStatus(Vacancy.Status.OPEN)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> getByEmployer(Long employerId) {
        return vacancyRepository.findByEmployerId(employerId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VacancyDto> search(String keyword) {
        return vacancyRepository.searchOpenVacancies(keyword)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public VacancyDto update(Long id, VacancyRequest request) {
        Vacancy vacancy = findById(id);
        verifyOwnershipOrAdmin(vacancy.getEmployer().getUser().getEmail());

        if (request.getTitle() != null) vacancy.setTitle(request.getTitle());
        if (request.getDescription() != null) vacancy.setDescription(request.getDescription());
        if (request.getRequirements() != null) vacancy.setRequirements(request.getRequirements());
        if (request.getSalaryRange() != null) vacancy.setSalaryRange(request.getSalaryRange());
        if (request.getStatus() != null) vacancy.setStatus(request.getStatus());

        return toDto(vacancyRepository.save(vacancy));
    }

    @Transactional
    public void delete(Long id) {
        if (!vacancyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vacancy", id);
        }
        vacancyRepository.deleteById(id);
    }


    // ------------ Helpers -----------------------------------------------

    private void verifyOwnershipOrAdmin(String ownerEmail) {
        String currentEmail = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = currentEmail.equals(ownerEmail);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedAccessException("You are not allowed to modify this resource");
        }
    }

    public Vacancy findById(Long id) {
        return vacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy", id));
    }

    public VacancyDto toDto(Vacancy v) {
        return VacancyDto.builder()
                .id(v.getId())
                .employerId(v.getEmployer().getId())
                .companyName(v.getEmployer().getCompanyName())
                .title(v.getTitle())
                .description(v.getDescription())
                .requirements(v.getRequirements())
                .salaryRange(v.getSalaryRange())
                .status(v.getStatus())
                .build();
    }
}
