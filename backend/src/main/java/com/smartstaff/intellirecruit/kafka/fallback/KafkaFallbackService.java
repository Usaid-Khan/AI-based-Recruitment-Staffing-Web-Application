package com.smartstaff.intellirecruit.kafka.fallback;

import com.smartstaff.intellirecruit.email.EmailService;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.kafka.event.AiGeneratedEvent;
import com.smartstaff.intellirecruit.service.AiContentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaFallbackService {
    @Autowired
    private AiContentService aiContentService;
    @Autowired
    private EmailService emailService;

    // Called when Kafka publish fails — does synchronously
    // what the Kafka consumer would have done asynchronously
    public void handleDirectly(AiGeneratedEvent event) {
        log.warn("Kafka unavailable — processing AI event directly " +
                        "for type: {}, entityId: {}",
                event.getFeatureType(), event.getEntityId());

        try {
            // 1. Save to DB synchronously
            AiGeneratedContent.ContentType contentType =
                    AiGeneratedContent.ContentType.valueOf(event.getFeatureType());

            aiContentService.save(
                    contentType,
                    event.getGeneratedContent(),
                    event.getEntityId()
            );
            log.info("Fallback: AI content saved to DB directly");

            // 2. Send email synchronously
            if (event.isSendEmailNotification() && event.getRecipientEmail() != null) {
                emailService.sendAiGenerationNotification(
                        event.getRecipientEmail(),
                        event.getRecipientName(),
                        event.getFeatureType()
                );
                log.info("Fallback: Email sent directly to {}",
                        event.getRecipientEmail());
            }
        } catch (Exception e) {
            log.error("Fallback processing also failed for type: {}, error: {}",
                    event.getFeatureType(), e.getMessage());
        }
    }
}
