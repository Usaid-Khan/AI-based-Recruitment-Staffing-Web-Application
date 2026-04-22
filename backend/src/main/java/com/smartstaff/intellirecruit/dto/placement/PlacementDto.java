package com.smartstaff.intellirecruit.dto.placement;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class PlacementDto {
    private Long id;
    private Long candidateId;
    private String candidateName;
    private Long employerId;
    private String companyName;
    private Long vacancyId;
    private String vacancyTitle;
    private String contractUrl;
    private LocalDate startDate;
}
