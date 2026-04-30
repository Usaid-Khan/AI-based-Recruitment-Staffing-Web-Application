package com.smartstaff.intellirecruit.ai.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ContractRequest {
    private Long candidateId;
    private Long employerId;
    private Long vacancyId;     // optional
    private LocalDate startDate;
    private String salaryAmount;
    private String contractDuration;        // e.g. "6 months", "permanent"
    private String additionalTerms;     // optional extra clauses
}
