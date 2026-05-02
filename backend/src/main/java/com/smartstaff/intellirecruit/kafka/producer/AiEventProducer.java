package com.smartstaff.intellirecruit.kafka.producer;

import com.smartstaff.intellirecruit.kafka.event.AiGeneratedEvent;
import com.smartstaff.intellirecruit.kafka.fallback.KafkaFallbackService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class AiEventProducer {
    @Autowired
    private KafkaTemplate<String, AiGeneratedEvent> kafkaTemplate;
    @Autowired
    private KafkaFallbackService kafkaFallbackService;

    @Value("${app.kafka.topics.ai-events}")
    private String aiEventsTopic;

    public void publishAiGeneratedEvent(AiGeneratedEvent event) {
        // Set a unique eventId if not already set
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }

        try {
            // Use featureType as partition key so same-type events go to same partition
            CompletableFuture<SendResult<String, AiGeneratedEvent>> future =
                    kafkaTemplate.send(aiEventsTopic, event.getFeatureType(), event);

            future.orTimeout(5, TimeUnit.SECONDS)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.info("AI event published to Kafka — " +
                                            "type: {}, entityId: {}, offset: {}",
                                    event.getFeatureType(),
                                    event.getEntityId(),
                                    result.getRecordMetadata().offset());
                        } else {
                            log.error("Kafka publish failed — " +
                                            "type: {}, error: {}. Using fallback.",
                                    event.getFeatureType(),
                                    ex.getMessage());
                            // FALLBACK
                            kafkaFallbackService.handleDirectly(event);
                        }
                    });
        } catch (Exception e) {
            // Kafka broker completely unreachable
            log.error("Kafka broker unreachable — type: {}. Using fallback.", event.getFeatureType());
            // FALLBACK
            kafkaFallbackService.handleDirectly(event);
        }
    }
}
