package com.smartstaff.intellirecruit.dto.placement;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NonNull;

import java.time.LocalDate;

@Data
public class PlacementRequest {
    @NotNull(message = "Candidate ID is required")
    private Long candidateId;

    @NotNull(message = "Employer ID is required")
    private Long employerId;

    private Long vacancyId;
    private String contractUrl;
    private LocalDate startDate;
}
