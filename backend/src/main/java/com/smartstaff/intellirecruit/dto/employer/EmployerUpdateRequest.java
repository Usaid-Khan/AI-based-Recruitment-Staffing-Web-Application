package com.smartstaff.intellirecruit.dto.employer;

import lombok.Data;

@Data
public class EmployerUpdateRequest {
    private String companyName;
    private String industry;
    private String website;
}
