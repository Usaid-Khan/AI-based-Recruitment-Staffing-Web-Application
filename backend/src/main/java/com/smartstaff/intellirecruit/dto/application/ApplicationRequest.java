package com.smartstaff.intellirecruit.dto.application;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationRequest {
    @NotNull(message = "Vacancy ID is required")
    private Long vacancyId;
}
