package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.entity.Employer;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VacancyGeneratorService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private EmployerRepository employerRepository;
    @Autowired
    private AiContentService aiContentService;

    public AiResponse generateVacancy(Long employerId, String jobTitle, String salaryRange, String experienceLevel, String keySkills, String customInstructions) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));

        String prompt = buildPrompt(employer, jobTitle, salaryRange, experienceLevel, keySkills, customInstructions);
        String generatedVacancy = geminiAiService.generate(prompt);

        aiContentService.save(
                AiGeneratedContent.ContentType.JOB_VACANCY,
                generatedVacancy,
                employerId
        );

        return AiResponse.builder()
                .content(generatedVacancy)
                .type("JOB_VACANCY")
                .entityId(employerId)
                .saved(true)
                .build();
    }

    private String buildPrompt(Employer employer, String jobTitle, String salaryRange, String experienceLevel, String keySkills, String customInstructions) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Generate a compelling job vacancy posting.\n\n");

        prompt.append("COMPANY DETAILS:\n");
        prompt.append("Company: ").append(employer.getCompanyName()).append("\n");
        prompt.append("Industry: ").append(
                employer.getIndustry() != null ? employer.getIndustry() : "Not specified"
        ).append("\n\n");

        prompt.append("JOB DETAILS:\n");
        prompt.append("Job Title: ").append(jobTitle).append("\n");
        prompt.append("Salary Range: ").append(
                salaryRange != null ? salaryRange : "Competitive"
        ).append("\n");
        prompt.append("Experience Level: ").append(
                experienceLevel != null ? experienceLevel : "Mid-level"
        ).append("\n");
        prompt.append("Key Skills Required: ").append(
                keySkills != null ? keySkills : "To be specified"
        ).append("\n\n");

        prompt.append("STRUCTURE THE POSTING WITH THESE SECTIONS:\n");
        prompt.append("1. Job Title\n");
        prompt.append("2. About the Company (2-3 sentences)\n");
        prompt.append("3. Role Overview (3-4 sentences)\n");
        prompt.append("4. Key Responsibilities (5-7 bullet points)\n");
        prompt.append("5. Requirements (5-6 bullet points)\n");
        prompt.append("6. What We Offer (4-5 bullet points including salary)\n");
        prompt.append("7. How to Apply (short closing paragraph)\n");

        if (customInstructions != null && !customInstructions.isBlank()) {
            prompt.append("\nADDITIONAL INSTRUCTIONS:\n").append(customInstructions).append("\n");
        }

        prompt.append("\nWrite ONLY the job posting. Make it professional and attractive to top talent.");

        return prompt.toString();
    }
}
