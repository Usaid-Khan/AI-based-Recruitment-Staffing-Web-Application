package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.repository.AiGeneratedContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AiContentService {
    @Autowired
    private AiGeneratedContentRepository aiContentRepository;

    @Transactional
    public AiGeneratedContent save(AiGeneratedContent.ContentType type, String content, Long entityId) {
        AiGeneratedContent record = AiGeneratedContent.builder()
                .contentType(type)
                .content(content)
                .entityId(entityId)
                .build();
        return aiContentRepository.save(record);
    }

    @Transactional(readOnly = true)
    public List<AiGeneratedContent> getByEntity(Long entityId) {
        return aiContentRepository.findByEntityId(entityId);
    }

    @Transactional(readOnly = true)
    public List<AiGeneratedContent> getByType(AiGeneratedContent.ContentType type) {
        return aiContentRepository.findByContentType(type);
    }

    // Get the most recent AI content for a specific entity+type combination
    @Transactional(readOnly = true)
    public String getLatestContent(AiGeneratedContent.ContentType type, Long entityId) {
        return aiContentRepository.findTopByContentTypeAndEntityIdOrderByCreatedAtDesc(type, entityId)
                .map(AiGeneratedContent::getContent)
                .orElse(null);
    }
}
