package com.smartstaff.intellirecruit.kafka.event;


import java.time.LocalDateTime;
import java.util.UUID;

public class AiEventBuilder {
    public static AiGeneratedEvent build(String featureType, Long entityId, String generatedContent, String triggeredByEmail, String recipientEmail, String recipientName) {
        return AiGeneratedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .featureType(featureType)
                .entityId(entityId)
                .generatedContent(generatedContent)
                .triggeredByEmail(triggeredByEmail)
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .sendEmailNotification(recipientEmail != null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Event without email notification
    public static AiGeneratedEvent buildSilent(String featureType, Long entityId, String generatedContent, String triggeredByEmail) {
        return AiGeneratedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .featureType(featureType)
                .entityId(entityId)
                .generatedContent(generatedContent)
                .triggeredByEmail(triggeredByEmail)
                .sendEmailNotification(false)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
