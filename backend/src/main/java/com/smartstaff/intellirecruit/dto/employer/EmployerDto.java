package com.smartstaff.intellirecruit.dto.employer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmployerDto {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String companyName;
    private String industry;
    private String website;
}
