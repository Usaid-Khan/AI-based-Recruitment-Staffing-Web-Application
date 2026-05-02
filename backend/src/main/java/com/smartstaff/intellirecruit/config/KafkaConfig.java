package com.smartstaff.intellirecruit.config;

import com.smartstaff.intellirecruit.kafka.event.AiGeneratedEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${app.kafka.topics.ai-events}")
    private String aiEventsTopic;

    @Value("${app.kafka.topics.email-events}")
    private String emailEventsTopic;

    @Bean
    public ProducerFactory<String, AiGeneratedEvent> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, AiGeneratedEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // Auto-create topics on startup
    @Bean
    public NewTopic aiEventsTopic() {
        return TopicBuilder.name(aiEventsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic emailEventsTopic() {
        return TopicBuilder.name(emailEventsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
