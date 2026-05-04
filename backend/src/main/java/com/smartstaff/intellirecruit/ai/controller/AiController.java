package com.smartstaff.intellirecruit.ai.controller;

import com.smartstaff.intellirecruit.ai.dto.*;
import com.smartstaff.intellirecruit.ai.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    @Autowired
    private BioGeneratorService bioGeneratorService;
    @Autowired
    private BioFilterService bioFilterService;
    @Autowired
    private VacancyGeneratorService vacancyGeneratorService;
    @Autowired
    private VacancyFilterService vacancyFilterService;
    @Autowired
    private RecommendationService recommendationService;
    @Autowired
    private ContractGeneratorService contractGeneratorService;
    @Autowired
    private EmailGeneratorService emailGeneratorService;
    @Autowired
    private BlogGeneratorService blogGeneratorService;

    // Feature 1: Generate candidate bio
    @PostMapping("/candidates/me/generate-bio")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<AiResponse> generateBio(@RequestBody(required = false) AiRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        String custom = request != null ? request.getCustomPrompt() : null;
        return ResponseEntity.ok(bioGeneratorService.generateBio(email, custom));
    }

    // Feature 2: Filter/clean candidate bio
    @PostMapping("/candidates/filter-bio")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiResponse> filterBio(@RequestParam String email, @RequestBody(required = false) AiRequest request) {
        String policies = request != null ? request.getCustomPrompt() : null;
        return ResponseEntity.ok(bioFilterService.filterBio(email, policies));
    }

    // Feature 3: Generate job vacancy
    @PostMapping("/employers/generate-vacancy")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<AiResponse> generateVacancy(@RequestParam String email, @RequestParam(required = false) String jobTitle, @RequestParam(required = false) String salaryRange, @RequestParam(required = false) String experienceLevel, @RequestParam(required = false) String keySkills, @RequestBody(required = false) AiRequest request) {
        String custom = request != null ? request.getCustomPrompt() : null;
        return ResponseEntity.ok(vacancyGeneratorService.generateVacancy(
                email, jobTitle, salaryRange, experienceLevel, keySkills, custom));
    }

    // Feature 4: Filter/rewrite job vacancy
    @PostMapping("/vacancies/{id}/filter")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiResponse> filterVacancy(@PathVariable Long id, @RequestBody(required = false) AiRequest request) {
        String policies = request != null ? request.getCustomPrompt() : null;
        return ResponseEntity.ok(vacancyFilterService.filterVacancy(id, policies));
    }

    // Feature 5: Recommend candidates for a vacancy
    @GetMapping("/vacancies/{id}/recommend")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<RecommendationResponse> recommend(@PathVariable Long id, @RequestParam(required = false) Integer minExperience) {
        return ResponseEntity.ok(recommendationService.recommendCandidates(id, minExperience));
    }

    // Feature 6: Generate employment contract
    @PostMapping("/generate-contract")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiResponse> generateContract(@RequestBody ContractRequest request) {
        return ResponseEntity.ok(contractGeneratorService.generateContract(request));
    }

    // Feature 7: Generate email template
    @PostMapping("/generate-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<AiResponse> generateEmail(@RequestBody EmailRequest request) {
        return ResponseEntity.ok(emailGeneratorService.generateEmail(request));
    }

    // Feature 8: Generate blog post
    @PostMapping("/generate-blog")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiResponse> generateBlog(@RequestBody BlogRequest request) {
        return ResponseEntity.ok(blogGeneratorService.generateBlogPost(request));
    }
}
