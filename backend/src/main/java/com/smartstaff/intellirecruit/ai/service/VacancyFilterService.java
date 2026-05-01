package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.entity.Vacancy;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.VacancyRepository;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VacancyFilterService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private VacancyRepository vacancyRepository;
    @Autowired
    private AiContentService aiContentService;

    public AiResponse filterVacancy(Long vacancyId, String agencyPolicies) {
        Vacancy vacancy = vacancyRepository.findById(vacancyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy", vacancyId));

        String prompt = buildPrompt(vacancy, agencyPolicies);
        String filteredVacancy = geminiAiService.generate(prompt);



        aiContentService.save(
                AiGeneratedContent.ContentType.FILTERED_VACANCY,
                filteredVacancy,
                vacancyId
        );

        return AiResponse.builder()
                .content(filteredVacancy)
                .type("FILTERED_VACANCY")
                .entityId(vacancyId)
                .saved(true)
                .build();
    }

    private String buildPrompt(Vacancy vacancy, String agencyPolicies) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are a compliance officer reviewing job postings for quality and policy adherence.\n\n");

        prompt.append("JOB POSTING TO REVIEW:\n");
        prompt.append("Title: ").append(vacancy.getTitle()).append("\n");

        if (vacancy.getDescription() != null) {
            prompt.append("Description:\n").append(vacancy.getDescription()).append("\n");
        }
        if (vacancy.getRequirements() != null) {
            prompt.append("Requirements:\n").append(vacancy.getRequirements()).append("\n");
        }
        if (vacancy.getSalaryRange() != null) {
            prompt.append("Salary Range: ").append(vacancy.getSalaryRange()).append("\n");
        }

        prompt.append("\nSTANDARD FILTERING RULES:\n");
        prompt.append("- Remove discriminatory requirements (age, gender, religion, nationality)\n");
        prompt.append("- Remove unrealistic or illegal requirements\n");
        prompt.append("- Ensure inclusive language throughout\n");
        prompt.append("- Remove vague or unprofessional language\n");
        prompt.append("- Improve clarity and structure where needed\n");
        prompt.append("- Ensure salary transparency where possible\n");

        if (agencyPolicies != null && !agencyPolicies.isBlank()) {
            prompt.append("\nAGENCY-SPECIFIC POLICIES:\n").append(agencyPolicies).append("\n");
        }

        prompt.append("\nReturn the complete rewritten job posting only. ");
        prompt.append("Maintain the original structure but fix all issues found.");

        return prompt.toString();
    }
}
