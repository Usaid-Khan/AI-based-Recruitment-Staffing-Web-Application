package com.smartstaff.intellirecruit.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponse {
    private String content;
    private String type;
    private Long entityId;
    private boolean saved;      // true if persisted to ai_generated_content table
}
