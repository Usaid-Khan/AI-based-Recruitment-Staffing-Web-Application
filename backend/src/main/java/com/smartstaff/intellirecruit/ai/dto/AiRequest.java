package com.smartstaff.intellirecruit.ai.dto;

import lombok.Data;

@Data
public class AiRequest {
    private String customPrompt;        // optional extra instructions from user
}
