package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BioGeneratorService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private AiContentService aiContentService;

    public AiResponse generateBio(Long candidateId, String customInstructions) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", candidateId));

        String prompt = buildPrompt(candidate, customInstructions);
        String generateBio = geminiAiService.generate(prompt);

        aiContentService.save(
                AiGeneratedContent.ContentType.BIO,
                generateBio,
                candidateId
        );

        return AiResponse.builder()
                .content(generateBio)
                .type("BIO")
                .entityId(candidateId)
                .saved(true)
                .build();
    }

    private String buildPrompt(Candidate candidate, String customInstructions) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Generate a professional biography for a job candidate.\n\n");
        prompt.append("CANDIDATE DETAILS:\n");
        prompt.append("Name: ").append(candidate.getUser().getName()).append("\n");
        prompt.append("Years of Experience: ").append(
                candidate.getExperienceYears() != null ? candidate.getExperienceYears() : "Not specified"
        ).append("\n");
        prompt.append("Skills: ").append(
                candidate.getSkills() != null ? candidate.getSkills() : "Not specified"
        ).append("\n");

        if (candidate.getBio() != null && !candidate.getBio().isBlank()) {
            prompt.append("Existing Notes: ").append(candidate.getBio()).append("\n");
        }

        prompt.append("\nREQUIREMENTS:\n");
        prompt.append("- Write in third person\n");
        prompt.append("- 150-200 words\n");
        prompt.append("- Professional and engaging tone\n");
        prompt.append("- Highlight key strengths and value proposition\n");
        prompt.append("- End with a forward-looking statement about career goals\n");

        if(customInstructions != null && !customInstructions.isBlank()) {
            prompt.append("\nADDITIONAL INSTRUCTIONS:\n").append(customInstructions).append("\n");
        }

        prompt.append("\nWrite ONLY the biography text, nothing else.");

        return prompt.toString();
    }
}
