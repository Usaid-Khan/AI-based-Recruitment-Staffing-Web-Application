package com.smartstaff.intellirecruit.kafka.consumer;

import com.smartstaff.intellirecruit.email.EmailService;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.kafka.event.AiGeneratedEvent;
import com.smartstaff.intellirecruit.service.AiContentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiEventConsumer {
    @Autowired
    private AiContentService aiContentService;
    @Autowired
    private EmailService emailService;

    @KafkaListener(topics = "${app.kafka.topics.ai-events}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeAiEvent(@Payload AiGeneratedEvent event, @Header(KafkaHeaders.RECEIVED_PARTITION) int partition, @Header(KafkaHeaders.OFFSET) long offset) {
        log.info("Consumed AI event — type: {}, entityId: {}, partition: {}, offset: {}",
                event.getFeatureType(), event.getEntityId(), partition, offset);

        try {
            // 1. Persist to ai_generated_content table asynchronously
            AiGeneratedContent.ContentType contentType = AiGeneratedContent.ContentType.valueOf(event.getFeatureType());

            aiContentService.save(
                    contentType,
                    event.getGeneratedContent(),
                    event.getEntityId()
            );

            log.info("AI content persisted to DB — type: {}", event.getFeatureType());

            // 2. Send email notification if requested
            if (event.isSendEmailNotification() && event.getRecipientEmail() != null) {
                emailService.sendAiGenerationNotification(
                        event.getRecipientEmail(),
                        event.getRecipientName(),
                        event.getFeatureType()
                );
                log.info("Email notification sent to: {}", event.getRecipientEmail());
            }
        } catch (Exception e) {
            log.error("Error processing AI event — eventId: {}, error: {}",
                    event.getEventId(), e.getMessage());
        }
    }
}
