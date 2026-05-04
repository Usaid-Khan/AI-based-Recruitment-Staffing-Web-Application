package com.smartstaff.intellirecruit.email;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {
    private final Parser parser = Parser.builder().build();
    private final HtmlRenderer renderer = HtmlRenderer.builder().build();

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // Core send method
    @Async      // non-blocking — fires and forgets on a thread pool
    public void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email sent — to: {}, subject: {}", toEmail, subject);
        } catch (Exception e) {
            log.error("Failed to send email to: {}, error: {}", toEmail, e.getMessage());
        }
    }

    // Welcome email after registration
    @Async
    public void sendWelcomeEmail(String toEmail, String name, String role) {
        String subject = "Welcome to IntelliRecruit!";
        String body = EmailTemplates.welcomeEmail(name, role);
        sendHtmlEmail(toEmail, subject, body);
    }

    // Application received confirmation
    @Async
    public void sendApplicationConfirmation(String toEmail, String candidateName, String vacancyTitle, String companyName) {
        String subject = "Application Received — " + vacancyTitle;
        String body = EmailTemplates.applicationConfirmation(candidateName, vacancyTitle, companyName);
        sendHtmlEmail(toEmail, subject, body);
    }

    // Application status update
    @Async
    public void sendApplicationStatusUpdate(String toEmail, String candidateName, String vacancyTitle, String newStatus) {
        String subject = "Application Update — " + vacancyTitle;
        String body = EmailTemplates.applicationStatusUpdate(candidateName, vacancyTitle, newStatus);
        sendHtmlEmail(toEmail, subject, body);
    }

    // Placement/offer notification
    @Async
    public void sendPlacementNotification(String toEmail, String candidateName, String companyName, String jobTitle, String startDate) {
        String subject = "Congratulations! You have been placed at " + companyName;
        String body = EmailTemplates.placementNotification(candidateName, companyName, jobTitle, startDate);
        sendHtmlEmail(toEmail, subject, body);
    }

    // AI generation notification (triggered by Kafka consumer)
    @Async
    public void sendAiGenerationNotification(String toEmail, String name, String featureType) {
        String subject = "Your AI Content is Ready";
        String body = EmailTemplates.aiGenerationReady(name, featureType);
        sendHtmlEmail(toEmail, subject, body);
    }

    // Send AI-generated email content directly (extracting subject if present)
    @Async
    public void sendRawAiEmail(String toEmail, String content) {
        String trimmed = content != null ? content.trim() : "";
        String subject = "AI-Generated Recruitment Email";
        String markdownBody = trimmed;

        // Try to extract subject case-insensitively
        if (trimmed.toLowerCase().startsWith("subject:")) {
            int firstNewline = trimmed.indexOf("\n");
            if (firstNewline > 8) {
                subject = trimmed.substring(8, firstNewline).trim();
                markdownBody = trimmed.substring(firstNewline).trim();
            }
        }

        log.info("Preparing raw AI email — Subject: {}", subject);
        
        // Convert Markdown to HTML
        Node document = parser.parse(markdownBody);
        String htmlBody = renderer.render(document);
        
        sendHtmlEmail(toEmail, subject, htmlBody);
    }

    // New vacancy notification to available candidates
    @Async
    public void sendNewVacancyAlert(String toEmail, String candidateName, String vacancyTitle, String companyName, String salaryRange) {
        String subject = "New Job Match: " + vacancyTitle + " at " + companyName;
        String body = EmailTemplates.newVacancyAlert(candidateName, vacancyTitle, companyName, salaryRange);
        sendHtmlEmail(toEmail, subject, body);
    }

    // Password reset
    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String resetToken) {
        String subject = "Password Reset Request";
        String body = EmailTemplates.passwordReset(name, resetToken);
        sendHtmlEmail(toEmail, subject, body);
    }
}
