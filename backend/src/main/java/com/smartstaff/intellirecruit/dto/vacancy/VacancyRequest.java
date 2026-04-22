package com.smartstaff.intellirecruit.dto.vacancy;

import com.smartstaff.intellirecruit.entity.Vacancy;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VacancyRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String requirements;
    private String salaryRange;
    private Vacancy.Status status;
}
