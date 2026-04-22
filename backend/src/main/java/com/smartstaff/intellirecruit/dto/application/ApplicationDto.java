package com.smartstaff.intellirecruit.dto.application;

import com.smartstaff.intellirecruit.entity.Application;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationDto {
    private Long id;
    private Long candidateId;
    private String candidateName;
    private Long vacancyId;
    private String vacancyTitle;
    private Application.Status status;
    private LocalDateTime appliedAt;
}
