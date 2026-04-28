package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.blog.BlogPostDto;
import com.smartstaff.intellirecruit.dto.blog.BlogPostRequest;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.BlogPostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blog")
public class BlogPostController {
    @Autowired
    private BlogPostService blogPostService;
    @Autowired
    private UserRepository userRepository;

    // Public: get all published posts
    @GetMapping
    public ResponseEntity<List<BlogPostDto>> getPublished() {
        return ResponseEntity.ok(blogPostService.getPublished());
    }

    // Public: get post by ID
    @GetMapping("/{id}")
    public ResponseEntity<BlogPostDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(blogPostService.getById(id));
    }

    // Admin: get all drafts
    @GetMapping("/drafts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BlogPostDto>> getDrafts() {
        return ResponseEntity.ok(blogPostService.getDrafts());
    }

    // Admin: create post
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BlogPostDto> create(@Valid @RequestBody BlogPostRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = getUser(email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(blogPostService.create(user.getId(), request));
    }

    // Admin: update post
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BlogPostDto> update(@PathVariable Long id, @Valid @RequestBody BlogPostRequest request) {
        return ResponseEntity.ok(blogPostService.update(id, request));
    }

    // Admin: publish a draft
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BlogPostDto> publish(@PathVariable Long id) {
        BlogPostRequest req = new BlogPostRequest();
        req.setPublish(true);
        return ResponseEntity.ok(blogPostService.update(id, req));
    }

    // Admin: delete post
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        blogPostService.delete(id);
        return ResponseEntity.noContent().build();
    }


    // ---------- Helper -----------------------------------------------
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
