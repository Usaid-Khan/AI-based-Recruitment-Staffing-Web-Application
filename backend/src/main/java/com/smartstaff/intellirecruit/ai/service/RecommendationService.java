package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.RecommendationResponse;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.entity.Vacancy;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.VacancyRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RecommendationService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private VacancyRepository vacancyRepository;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private ObjectMapper objectMapper;

    public RecommendationResponse recommendCandidates(Long vacancyId, Integer minExperience) {
        Vacancy vacancy = vacancyRepository.findById(vacancyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy", vacancyId));

        List<Candidate> candidates = minExperience != null
                ? candidateRepository.findAvailableWithMinExperience(minExperience)
                : candidateRepository.findByIsAvailableTrue();

        if(candidates.isEmpty()) {
            return RecommendationResponse.builder()
                    .vacancyId(vacancyId)
                    .vacancyTitle(vacancy.getTitle())
                    .rankedCandidates(List.of())
                    .aiAnalysis("No available candidates found matching the criteria.")
                    .build();
        }

        String prompt = buildPrompt(vacancy, candidates);
        String rawResponse = geminiAiService.generate(prompt);

        return parseResponse(rawResponse, vacancy, candidates);
    }

    private String buildPrompt(Vacancy vacancy, List<Candidate> candidates) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an expert recruitment consultant. ");
        prompt.append("Rank the following candidates for this job vacancy.\n\n");

        prompt.append("JOB VACANCY:\n");
        prompt.append("Title: ").append(vacancy.getTitle()).append("\n");
        prompt.append("Description: ").append(
                vacancy.getDescription() != null ? vacancy.getDescription() : "N/A"
        ).append("\n");
        prompt.append("Requirements: ").append(
                vacancy.getRequirements() != null ? vacancy.getRequirements() : "N/A"
        ).append("\n\n");

        prompt.append("AVAILABLE CANDIDATES:\n");
        for (int i = 0; i < candidates.size(); i++) {
            Candidate c = candidates.get(i);
            prompt.append("Candidate ").append(i + 1).append(":\n");
            prompt.append("  ID: ").append(c.getId()).append("\n");
            prompt.append("  Name: ").append(c.getUser().getName()).append("\n");
            prompt.append("  Experience: ").append(
                    c.getExperienceYears() != null ? c.getExperienceYears() + " years" : "N/A"
            ).append("\n");
            prompt.append("  Skills: ").append(
                    c.getSkills() != null ? c.getSkills() : "N/A"
            ).append("\n");
            prompt.append("  Bio: ").append(
                    c.getBio() != null ? c.getBio() : "N/A"
            ).append("\n\n");
        }

        prompt.append("INSTRUCTIONS:\n");
        prompt.append("Rank ALL candidates from best to worst fit for this vacancy.\n");
        prompt.append("Respond ONLY with valid JSON in this exact format:\n\n");
        prompt.append("{\n");
        prompt.append("  \"aiAnalysis\": \"overall analysis of the candidate pool\",\n");
        prompt.append("  \"rankedCandidates\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"candidateId\": 1,\n");
        prompt.append("      \"rank\": 1,\n");
        prompt.append("      \"matchScore\": 92,\n");
        prompt.append("      \"reasoning\": \"why this candidate fits\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append("Use the exact candidateId values from the candidate list above.");

        return prompt.toString();
    }

    private RecommendationResponse parseResponse(String rawResponse, Vacancy vacancy, List<Candidate> candidates) {
        try {
            // Strip markdown code fences if Gemini wraps in ```json ... ```
            String cleaned = rawResponse
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            var root = objectMapper.readTree(cleaned);
            String aiAnalysis = root.path("aiAnalysis").asText();

            var candidateMap = candidates.stream()
                    .collect(Collectors.toMap(
                            Candidate::getId,
                            c -> c.getUser().getName()
                    ));

            List<RecommendationResponse.RankedCandidate> ranked = new ArrayList<>();

            root.path("rankedCandidates").forEach(node -> {
                Long id = node.path("candidateId").asLong();
                ranked.add(RecommendationResponse.RankedCandidate.builder()
                        .candidateId(id)
                        .name(candidateMap.getOrDefault(id, "Unknown"))
                        .rank(node.path("rank").asInt())
                        .matchScore(node.path("matchScore").asInt())
                        .reasoning(node.path("reasoning").asText())
                        .build());
            });

            return RecommendationResponse.builder()
                    .vacancyId(vacancy.getId())
                    .vacancyTitle(vacancy.getTitle())
                    .rankedCandidates(ranked)
                    .aiAnalysis(aiAnalysis)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse recommendation JSON: {}", e.getMessage());
            // Fallback — return raw response as analysis
            return RecommendationResponse.builder()
                    .vacancyId(vacancy.getId())
                    .vacancyTitle(vacancy.getTitle())
                    .rankedCandidates(List.of())
                    .aiAnalysis(rawResponse)
                    .build();
        }
    }
}
