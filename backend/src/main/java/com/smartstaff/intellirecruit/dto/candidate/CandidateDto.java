package com.smartstaff.intellirecruit.dto.candidate;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CandidateDto {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String bio;
    private String skills;
    private Integer experienceYears;
    private String resumeUrl;
    private Boolean isAvailable;
}
