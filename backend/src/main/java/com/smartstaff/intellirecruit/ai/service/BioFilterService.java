package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.kafka.event.AiEventBuilder;
import com.smartstaff.intellirecruit.kafka.producer.AiEventProducer;
import com.smartstaff.intellirecruit.redis.AiCacheService;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class BioFilterService {
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
    @Autowired
    private UserRepository userRepository;

    public AiResponse filterBio(String email, String agencyPolicies) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        Candidate candidate = candidateRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User Candidate", user.getId()));

        // 1. Check Redis cache first
        String cached = aiCacheService.getCachedResponse("FILTERED_BIO", candidate.getId());
        if (cached != null && agencyPolicies == null) {
            return AiResponse.builder()
                    .content(cached)
                    .type("FILTERED_BIO")
                    .entityId(candidate.getId())
                    .saved(false) // came from cache, not freshly generated
                    .build();
        }

        // 2. Cache miss — call Gemini
        if (candidate.getBio() == null || candidate.getBio().isBlank()) {
            throw new IllegalArgumentException("Candidate has no bio to filter. Generate a bio first.");
        }

        String prompt = buildPrompt(candidate.getBio(), agencyPolicies);
        String filteredBio = geminiAiService.generate(prompt);

        // 3. Persist the filtered bio back to the candidate's profile in the DB
        candidate.setBio(filteredBio);
        candidateRepository.save(candidate);

        // 3a. Evict the stale BIO cache so the next bio-generation reads fresh data
        aiCacheService.evictCache("BIO", candidate.getId());

        // 4. Cache the new FILTERED_BIO result
        aiCacheService.cacheResponse("FILTERED_BIO", candidate.getId(), filteredBio);

        // Get current logged-in user
        String triggeredBy = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        // Publish to Kafka — no email notification for filter operations
        aiEventProducer.publishAiGeneratedEvent(
                AiEventBuilder.buildSilent(
                        "FILTERED_BIO",
                        candidate.getId(),
                        filteredBio,
                        triggeredBy
                )
        );

//        aiContentService.save(
//                AiGeneratedContent.ContentType.FILTERED_BIO,
//                filteredBio,
//                candidateId
//        );

        return AiResponse.builder()
                .content(filteredBio)
                .type("FILTERED_BIO")
                .entityId(candidate.getId())
                .saved(true)
                .build();
    }

    private String buildPrompt(String originalBio, String agencyPolicies) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are a content compliance officer for a recruitment agency.\n\n");
        prompt.append("ORIGINAL CANDIDATE BIO:\n").append(originalBio).append("\n\n");

        prompt.append("YOUR TASK:\n");
        prompt.append("Review and rewrite this bio to comply with our agency standards.\n\n");

        prompt.append("STANDARD FILTERING RULES:\n");
        prompt.append("- Remove any discriminatory language (age, gender, religion, race)\n");
        prompt.append("- Remove contact details (phone, email, social media handles)\n");
        prompt.append("- Remove specific salary expectations or demands\n");
        prompt.append("- Remove any negative language or complaints about past employers\n");
        prompt.append("- Remove exaggerated or unverifiable claims\n");
        prompt.append("- Ensure professional and neutral tone throughout\n");

        if (agencyPolicies != null && !agencyPolicies.isBlank()) {
            prompt.append("\nADDITIONAL AGENCY POLICIES:\n").append(agencyPolicies).append("\n");
        }

        prompt.append("\nReturn ONLY the cleaned, rewritten bio. ");
        prompt.append("If no changes were needed, return the original bio as-is.");

        return prompt.toString();
    }
}
