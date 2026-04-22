package com.smartstaff.intellirecruit.dto.candidate;

import lombok.Data;

@Data
public class CandidateUpdateRequest {
    private String bio;
    private String skills;
    private Integer experienceYears;
    private Boolean isAvailable;
}
