package com.smartstaff.intellirecruit.dto.blog;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BlogPostRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private boolean publish = false;
}
