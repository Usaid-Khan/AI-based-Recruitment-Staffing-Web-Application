package com.smartstaff.intellirecruit.dto.order;

import com.smartstaff.intellirecruit.entity.Order;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderDto {
    private Long id;
    private Long employerId;
    private String companyName;
    private String title;
    private String description;
    private Order.Status status;
    private List<Long> shortlistedCandidates;
    private LocalDateTime createdAt;
}
