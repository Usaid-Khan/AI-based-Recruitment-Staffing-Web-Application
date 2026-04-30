package com.smartstaff.intellirecruit.ai.service;

import com.google.genai.errors.ClientException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class GeminiAiService {
    @Autowired
    private ChatClient.Builder chatClientBuilder;
    private static String SYSTEM_PERSONA = "You are an expert HR consultant and professional writer specializing " +
            "in recruitment and staffing. You write clear, professional, and " +
            "compelling content tailored for the recruitment industry. " +
            "Always respond with well-structured, ready-to-use content only. " +
            "Do not include explanations, meta-commentary, or preamble.";

    // Core method — all AI features call this
    public String generate(String userPrompt) {
        return generate(SYSTEM_PERSONA, userPrompt);
    }

    // Overload — allows custom system prompt per feature
    public String generate(String systemPrompt, String userPrompt) {
        try {
            ChatClient chatClient = chatClientBuilder.build();

            Prompt prompt = new Prompt(List.of(
                    new SystemMessage(systemPrompt),
                    new UserMessage(userPrompt)));

            String response = chatClient.prompt(prompt).call().content();

            log.info("Gemini response received — length: {} chars",
                    response != null ? response.length() : 0);

            return response;
        } catch (Exception e) {
            // Find root cause
            Throwable current = e;
            com.google.genai.errors.ClientException clientEx = null;
            
            while (current != null) {
                if (current instanceof com.google.genai.errors.ClientException) {
                    clientEx = (com.google.genai.errors.ClientException) current;
                    break;
                }
                current = current.getCause();
            }

            // Handle specific Gemini API errors, especially quota limits
            if (clientEx != null) {
                // 429 indicates quota exceeded; provide a clearer message
                if (clientEx.getMessage() != null && clientEx.getMessage().contains("429")) {
                    log.error("Gemini quota exceeded: {}", clientEx.getMessage());
                    throw new com.smartstaff.intellirecruit.exception.AiQuotaExceededException("Gemini API quota exceeded. Please try again later.", clientEx);
                }
            }
            // Fallback for other exceptions
            log.error("Gemini API call failed: {}", e.getMessage());
            throw new RuntimeException("AI generation failed. Please try again later.", e);
        }
    }
}
