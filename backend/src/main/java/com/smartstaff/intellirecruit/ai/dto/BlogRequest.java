package com.smartstaff.intellirecruit.ai.dto;

import lombok.Data;

@Data
public class BlogRequest {
    private String topic;
    private String targetAudience;      // e.g. "job seekers", "HR managers"
    private String tone;            // "informative", "inspiring", "practical"
    private Integer wordCount;      // approximate target word count
    private String keywords;        // SEO keywords to include
}
