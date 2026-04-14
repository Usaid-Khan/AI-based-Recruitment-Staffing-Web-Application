package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findByAdminId(Long adminId);

    // Only published posts (publishedAt is not null)
    List<BlogPost> findByPublishedAtIsNotNullOrderByPublishedAtDesc();

    // Drafts (not yet published)
    List<BlogPost> findByPublishedAtIsNull();
}
