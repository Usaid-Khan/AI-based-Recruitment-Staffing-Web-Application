package com.smartstaff.intellirecruit.dto.order;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private List<Long> shortlistedCandidates;
}
