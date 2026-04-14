package com.smartstaff.intellirecruit.entity;

import com.smartstaff.intellirecruit.enums.ContentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_generated_content")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiGeneratedContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentType contentType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // Generic reference: could be candidateId, vacancyId, orderId, etc.
    @Column(name = "entity_id")
    private Long entityId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
