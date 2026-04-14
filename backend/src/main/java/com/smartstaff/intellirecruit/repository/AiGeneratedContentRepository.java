package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiGeneratedContentRepository extends JpaRepository<AiGeneratedContent, Long> {
    List<AiGeneratedContent> findByContentType(AiGeneratedContent.ContentType contentType);

    List<AiGeneratedContent> findByEntityId(Long entityId);

    // Get the latest AI content of a given type for a specific entity
    Optional<AiGeneratedContent> findTopByContentTypeAndEntityIdOrderByCreatedAtDesc(AiGeneratedContent.ContentType contentType, Long entityId);
}
