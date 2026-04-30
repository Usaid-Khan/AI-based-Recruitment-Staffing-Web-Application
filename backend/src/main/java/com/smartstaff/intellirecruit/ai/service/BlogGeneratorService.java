package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.ai.dto.BlogRequest;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BlogGeneratorService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private AiContentService aiContentService;

    public AiResponse generateBlogPost(BlogRequest request) {
        String prompt = buildPrompt(request);
        String generatedPost = geminiAiService.generate(prompt);

        aiContentService.save(
                AiGeneratedContent.ContentType.BLOG_POST,
                generatedPost,
                null
        );

        return AiResponse.builder()
                .content(generatedPost)
                .type("BLOG_POST")
                .entityId(null)
                .saved(true)
                .build();
    }

    private String buildPrompt(BlogRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Write a high-quality blog post for a recruitment and staffing agency website.\n\n");

        prompt.append("BLOG POST REQUIREMENTS:\n");
        prompt.append("Topic: ").append(request.getTopic()).append("\n");
        prompt.append("Target Audience: ").append(
                request.getTargetAudience() != null ? request.getTargetAudience() : "job seekers and HR professionals"
        ).append("\n");
        prompt.append("Tone: ").append(
                request.getTone() != null ? request.getTone() : "informative and professional"
        ).append("\n");
        prompt.append("Approximate Word Count: ").append(
                request.getWordCount() != null ? request.getWordCount() : 600
        ).append(" words\n");

        if (request.getKeywords() != null && !request.getKeywords().isBlank()) {
            prompt.append("SEO Keywords to include naturally: ").append(request.getKeywords()).append("\n");
        }

        prompt.append("\nSTRUCTURE:\n");
        prompt.append("1. Engaging headline (H1)\n");
        prompt.append("2. Hook introduction (2-3 sentences)\n");
        prompt.append("3. Main body with 3-5 subheadings (H2)\n");
        prompt.append("4. Practical tips or takeaways\n");
        prompt.append("5. Strong conclusion with a call to action\n");

        prompt.append("\nQUALITY STANDARDS:\n");
        prompt.append("- Original, insightful content — avoid generic advice\n");
        prompt.append("- Use real-world examples and scenarios\n");
        prompt.append("- Include actionable tips the reader can apply immediately\n");
        prompt.append("- Use markdown formatting (# for H1, ## for H2, ** for bold)\n");

        prompt.append("\nWrite the complete blog post now.");

        return prompt.toString();
    }
}
