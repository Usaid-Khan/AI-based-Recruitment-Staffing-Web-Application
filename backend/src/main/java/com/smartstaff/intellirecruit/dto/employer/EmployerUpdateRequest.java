package com.smartstaff.intellirecruit.dto.employer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmployerUpdateRequest {
    private String companyName;
    private String industry;
    private String website;
}
