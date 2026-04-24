package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.candidate.CandidateDto;
import com.smartstaff.intellirecruit.dto.candidate.CandidateUpdateRequest;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.DuplicateResourceException;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.exception.UnauthorizedAccessException;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CandidateService {
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private UserRepository userRepository;

    // Called after registration to create a candidate profile
    @Transactional
    public CandidateDto createProfile(Long userId) {
        if(candidateRepository.findByUserId(userId).isPresent()) {
            throw new DuplicateResourceException("Candidate profile already exists for user: " + userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Candidate candidate = Candidate.builder()
                .user(user)
                .isAvailable(true)
                .build();

        return toDto(candidateRepository.save(candidate));
    }

    @Transactional(readOnly = true)
    public CandidateDto getById(Long id) {
        return toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public CandidateDto getByUserId(Long userId) {
        return toDto(candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for user: " + userId)));
    }

    @Transactional(readOnly = true)
    public List<CandidateDto> getAll() {
        return candidateRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CandidateDto> getAvailable() {
        return candidateRepository.findByIsAvailableTrue()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CandidateDto> search(String keyword) {
        return candidateRepository.searchByKeyword(keyword)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CandidateDto update(Long id, CandidateUpdateRequest request) {
        Candidate candidate = findById(id);
        verifyOwnershipOrAdmin(candidate.getUser().getEmail());

        if(request.getBio() != null) candidate.setBio(request.getBio());
        if(request.getSkills() != null) candidate.setSkills(request.getSkills());
        if(request.getExperienceYears() != null) candidate.setExperienceYears(request.getExperienceYears());
        if(request.getIsAvailable() != null) candidate.setIsAvailable(request.getIsAvailable());

        return toDto(candidateRepository.save(candidate));
    }

    @Transactional
    public String uploadResume(Long id, MultipartFile file) throws IOException {
        Candidate candidate = findById(id);
        verifyOwnershipOrAdmin(candidate.getUser().getEmail());

        // Store in uploads/resumes directory
        String uploadDir = "uploads/resumes/";
        Files.createDirectories(Paths.get(uploadDir));

        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + filename);
        Files.write(filePath, file.getBytes());

        candidate.setResumeUrl("/resumes/" + filename);

        candidateRepository.save(candidate);

        return candidate.getResumeUrl();
    }

    @Transactional
    public void delete(Long id) {
        if(!candidateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Candidate", id);
        }
        candidateRepository.deleteById(id);
    }


    // --------------- Helpers -------------------------------------------------------

    private void verifyOwnershipOrAdmin(String ownerEmail) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = currentEmail.equals(ownerEmail);

        if(!isAdmin && !isOwner) {
            throw new UnauthorizedAccessException("You are not allowed to modify this resource");
        }
    }

    private Candidate findById(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", id));
    }

    public CandidateDto toDto(Candidate c) {
        return CandidateDto.builder()
                .id(c.getId())
                .userId(c.getUser().getId())
                .name(c.getUser().getName())
                .email(c.getUser().getEmail())
                .bio(c.getBio())
                .skills(c.getSkills())
                .experienceYears(c.getExperienceYears())
                .resumeUrl(c.getResumeUrl())
                .isAvailable(c.getIsAvailable())
                .build();
    }
}
