package com.smartstaff.intellirecruit.dto.blog;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BlogPostDto {
    private Long id;
    private Long adminId;
    private String authorName;
    private String title;
    private String content;
    private LocalDateTime publishedAt;
    private boolean published;
}
