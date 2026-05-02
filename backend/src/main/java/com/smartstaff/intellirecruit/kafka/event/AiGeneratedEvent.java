package com.smartstaff.intellirecruit.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGeneratedEvent {
    private String eventId;         // UUID for deduplication
    private String featureType;     // BIO, CONTRACT, EMAIL, etc.
    private Long entityId;          // candidateId, vacancyId, etc.
    private String generatedContent;
    private String triggeredByEmail; // who triggered the generation
    private LocalDateTime timestamp;

    // Email notification details
    private String recipientEmail;
    private String recipientName;
    private boolean sendEmailNotification;
}
