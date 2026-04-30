package com.smartstaff.intellirecruit.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private Long vacancyId;
    private String vacancyTitle;
    private List<RankedCandidate> rankedCandidates;
    private String aiAnalysis;      // overall analysis from Gemini

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RankedCandidate {
        private Long candidateId;
        private String name;
        private Integer rank;
        private String reasoning;       // why this candidate was ranked here
        private Integer matchScore;     // 0-100
    }
}
