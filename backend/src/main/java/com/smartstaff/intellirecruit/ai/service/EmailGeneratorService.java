package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.ai.dto.EmailRequest;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.kafka.event.AiEventBuilder;
import com.smartstaff.intellirecruit.kafka.producer.AiEventProducer;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class EmailGeneratorService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private AiContentService aiContentService;
    @Autowired
    private AiEventProducer aiEventProducer;

    public AiResponse generateEmail(EmailRequest request) {
        String prompt = buildPrompt(request);
        String generatedEmail = geminiAiService.generate(prompt);

        String triggeredBy = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        // Notify recipient via email
        aiEventProducer.publishAiGeneratedEvent(
                AiEventBuilder.build(
                        "EMAIL",
                        null, // no specific entity ID needed for generic emails
                        generatedEmail,
                        triggeredBy,
                        request.getRecipientEmail(),
                        request.getRecipientName()
                )
        );

//        aiContentService.save(
//                AiGeneratedContent.ContentType.EMAIL,
//                generatedEmail,
//                null // no specific entity linked to emails
//        );

        return AiResponse.builder()
                .content(generatedEmail)
                .type("EMAIL")
                .entityId(null)
                .saved(true)
                .build();
    }

    private String buildPrompt(EmailRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Generate a professional recruitment email.\n\n");

        prompt.append("EMAIL DETAILS:\n");
        prompt.append("Email Type: ").append(formatEmailType(request.getEmailType())).append("\n");
        prompt.append("Recipient Name: ").append(
                request.getRecipientName() != null ? request.getRecipientName() : "[Recipient Name]"
        ).append("\n");
        prompt.append("Recipient Role: ").append(
                request.getRecipientRole() != null ? request.getRecipientRole() : "candidate"
        ).append("\n");
        prompt.append("Tone: ").append(
                request.getTone() != null ? request.getTone() : "professional"
        ).append("\n");

        if (request.getContextDetails() != null && !request.getContextDetails().isBlank()) {
            prompt.append("Context/Details: ").append(request.getContextDetails()).append("\n");
        }

        prompt.append("\nEMAIL TYPES GUIDE:\n");
        prompt.append("- interview_invite: Invite candidate for interview (include date/time placeholders)\n");
        prompt.append("- rejection: Polite rejection after application review\n");
        prompt.append("- offer: Job offer letter with position and salary details\n");
        prompt.append("- follow_up: Follow up after interview\n");
        prompt.append("- welcome: Welcome email for new placement\n");
        prompt.append("- reference_request: Request for reference from candidate\n");

        prompt.append("\nFORMAT REQUIREMENTS:\n");
        prompt.append("- Include: Subject line, greeting, body paragraphs, closing, signature\n");
        prompt.append("- Use [PLACEHOLDER] for specific details that need to be filled in\n");
        prompt.append("- Keep it concise but warm and professional\n");
        prompt.append("- Maximum 300 words\n");

        prompt.append("\nOutput only the complete email, starting with 'Subject:'");

        return prompt.toString();
    }

    private String formatEmailType(String type) {
        if (type == null) return "General recruitment email";
        return type.replace("_", " ").substring(0, 1).toUpperCase()
                + type.replace("_", " ").substring(1);
    }
}
