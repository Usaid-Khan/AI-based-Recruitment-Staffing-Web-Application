package com.smartstaff.intellirecruit.dto.vacancy;

import com.smartstaff.intellirecruit.entity.Vacancy;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VacancyDto {
    private Long id;
    private Long employerId;
    private String companyName;
    private String title;
    private String description;
    private String requirements;
    private String salaryRange;
    private Vacancy.Status status;
}
