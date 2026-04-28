package com.smartstaff.intellirecruit.dto.order;

import com.smartstaff.intellirecruit.entity.Order;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private Order.Status status;
    private List<Long> shortlistedCandidates;
}
