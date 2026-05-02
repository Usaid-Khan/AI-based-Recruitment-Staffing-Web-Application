package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.kafka.event.AiEventBuilder;
import com.smartstaff.intellirecruit.kafka.producer.AiEventProducer;
import com.smartstaff.intellirecruit.redis.AiCacheService;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class BioGeneratorService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private AiContentService aiContentService;
    @Autowired
    private AiCacheService aiCacheService;
    @Autowired
    private AiEventProducer aiEventProducer;

    public AiResponse generateBio(Long candidateId, String customInstructions) {
        // 1. Check Redis cache first
        String cached = aiCacheService.getCachedResponse("BIO", candidateId);
        if (cached != null && customInstructions == null) {
            return AiResponse.builder()
                    .content(cached)
                    .type("BIO")
                    .entityId(candidateId)
                    .saved(false) // came from cache, not freshly generated
                    .build();
        }

        // 2. Cache miss — call Gemini
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", candidateId));

        String prompt = buildPrompt(candidate, customInstructions);
        String generatedBio = geminiAiService.generate(prompt);

        // 3. Store in Redis cache
        aiCacheService.cacheResponse("BIO", candidateId, generatedBio);

        // 5. Get current logged-in user email
        String triggeredBy = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        // 6. Publish to Kafka — consumer will save to DB + send email
        //    If Kafka is down, fallback handles it synchronously
        aiEventProducer.publishAiGeneratedEvent(
                AiEventBuilder.build(
                        "BIO",
                        candidateId,
                        generatedBio,
                        triggeredBy,
                        candidate.getUser().getEmail(),   // notify candidate
                        candidate.getUser().getName()
                )
        );

//        aiContentService.save(
//                AiGeneratedContent.ContentType.BIO,
//                generatedBio,
//                candidateId
//        );

        return AiResponse.builder()
                .content(generatedBio)
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
