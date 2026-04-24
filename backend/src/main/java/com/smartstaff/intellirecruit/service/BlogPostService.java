package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.blog.BlogPostDto;
import com.smartstaff.intellirecruit.dto.blog.BlogPostRequest;
import com.smartstaff.intellirecruit.entity.BlogPost;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.BlogPostRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BlogPostService {
    @Autowired
    private BlogPostRepository blogPostRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public BlogPostDto create(Long adminId, BlogPostRequest request) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        BlogPost post = BlogPost.builder()
                .admin(admin)
                .title(request.getTitle())
                .content(request.getContent())
                .publishedAt(request.isPublish() ? LocalDateTime.now() : null)
                .build();

        return toDto(blogPostRepository.save(post));
    }

    @Transactional(readOnly = true)
    public BlogPostDto getById(Long id) {
        return toDto(blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BlogPost", id)));
    }

    @Transactional(readOnly = true)
    public List<BlogPostDto> getPublished() {
        return blogPostRepository.findByPublishedAtIsNotNullOrderByPublishedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BlogPostDto> getDrafts() {
        return blogPostRepository.findByPublishedAtIsNull()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public BlogPostDto update(Long id, BlogPostRequest request) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BlogPost", id));

        if (request.getTitle() != null) post.setTitle(request.getTitle());
        if (request.getContent() != null) post.setContent(request.getContent());

        // Publish if requested and not already published
        if (request.isPublish() && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }

        return toDto(blogPostRepository.save(post));
    }

    @Transactional
    public void delete(Long id) {
        if (!blogPostRepository.existsById(id)) {
            throw new ResourceNotFoundException("BlogPost", id);
        }
        blogPostRepository.deleteById(id);
    }


    // ---------- Helpers -------------------------------------------------

    public BlogPostDto toDto(BlogPost p) {
        return BlogPostDto.builder()
                .id(p.getId())
                .adminId(p.getAdmin().getId())
                .authorName(p.getAdmin().getName())
                .title(p.getTitle())
                .content(p.getContent())
                .publishedAt(p.getPublishedAt())
                .published(p.getPublishedAt() != null)
                .build();
    }
}
