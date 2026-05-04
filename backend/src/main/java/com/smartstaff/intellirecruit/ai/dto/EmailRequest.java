package com.smartstaff.intellirecruit.ai.dto;

import lombok.Data;

@Data
public class EmailRequest {
    private String emailType;       // e.g. "interview_invite", "rejection", "offer"
    private String recipientName;
    private String recipientEmail;
    private String recipientRole;       // "candidate" or "employer"
    private String contextDetails;      // e.g. job title, company name, date
    private String tone;            // "formal", "friendly", "professional"
}
