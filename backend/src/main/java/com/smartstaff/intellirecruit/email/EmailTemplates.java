package com.smartstaff.intellirecruit.email;

public class EmailTemplates {
    // ---------- Shared HTML wrapper ------------------------------
    private static String wrap(String title, String content) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
              <div class="container" style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div class="header" style="background-color: #1a1a2e; color: #ffffff; padding: 24px 32px;">
                  <h1 style="margin: 0; font-size: 22px;">IntelliRecruit</h1>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #aaaaaa;">AI-Powered Recruitment Platform</p>
                </div>
                <div class="body" style="padding: 32px; color: #333333; line-height: 1.7;">
                  <h2 style="color: #1a1a2e; margin-top: 0;">%s</h2>
                  %s
                </div>
                <div class="footer" style="background-color: #f8f8f8; padding: 16px 32px; font-size: 12px; color: #999999; text-align: center;">
                  &copy; 2026 IntelliRecruit. All rights reserved.<br>
                  This is an automated message. Please do not reply.
                </div>
              </div>
            </body>
            </html>
            """.formatted(title, content);
    }

    // ---------- Welcome email ------------------------------
    public static String welcomeEmail(String name, String role) {
        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>Welcome to <strong>IntelliRecruit</strong>! Your account has been created successfully.</p>
            <p>Your role: <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; background-color: #e0e7ff; color: #4f46e5; font-size: 13px;">%s</span></p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Here is what you can do next:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Browse open vacancies</li>
              <li>Explore our AI-powered features</li>
            </ul>
            <p>We are excited to have you on board!</p>
            """.formatted(name, role);
        return wrap("Welcome aboard!", content);
    }

    // ---------- Application confirmation ------------------------------
    public static String applicationConfirmation(String candidateName, String vacancyTitle, String companyName) {
        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>Your application has been successfully submitted.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p><strong>Position:</strong> %s</p>
            <p><strong>Company:</strong> %s</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Our team and the employer will review your application. 
               You will be notified of any updates via email.</p>
            <p>You can track your application status by logging into your dashboard.</p>
            """.formatted(candidateName, vacancyTitle, companyName);
        return wrap("Application Submitted Successfully", content);
    }

    // ---------- Application status update ------------------------------
    public static String applicationStatusUpdate(String candidateName, String vacancyTitle, String newStatus) {
        String statusMessage = switch (newStatus.toUpperCase()) {
            case "SHORTLISTED" -> "Great news! You have been shortlisted for this position.";
            case "INTERVIEWED" -> "Your interview has been scheduled. Please check your dashboard.";
            case "OFFERED"     -> "Congratulations! You have received a job offer!";
            case "REJECTED"    -> "Thank you for your interest. Unfortunately you were not selected at this time.";
            default            -> "Your application status has been updated.";
        };

        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>%s</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p><strong>Position:</strong> %s</p>
            <p><strong>New Status:</strong> <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; background-color: #e0e7ff; color: #4f46e5; font-size: 13px;">%s</span></p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Log in to your dashboard for more details.</p>
            """.formatted(candidateName, statusMessage, vacancyTitle, newStatus);
        return wrap("Application Status Update", content);
    }

    // ---------- Placement notification ------------------------------
    public static String placementNotification(String candidateName, String companyName, String jobTitle, String startDate) {
        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>Congratulations! We are thrilled to inform you that you have been 
               successfully placed in a new position.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p><strong>Company:</strong> %s</p>
            <p><strong>Position:</strong> %s</p>
            <p><strong>Start Date:</strong> %s</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Your contract document will be shared with you shortly. 
               Please log in to your dashboard to review and sign it.</p>
            <p>We wish you all the best in your new role!</p>
            """.formatted(candidateName, companyName, jobTitle, startDate);
        return wrap("Congratulations on Your New Placement!", content);
    }

    // ---------- AI generation ready ------------------------------
    public static String aiGenerationReady(String name, String featureType) {
        String readable = featureType.replace("_", " ").toLowerCase();
        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>Your AI-generated <strong>%s</strong> is ready and has been saved to your account.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Log in to your dashboard to review, edit, and use the generated content.</p>
            <p>Our AI uses Google Gemini to produce professional, tailored content 
               specifically for your recruitment needs.</p>
            """.formatted(name, readable);
        return wrap("Your AI Content is Ready", content);
    }

    // ---------- New vacancy alert ------------------------------
    public static String newVacancyAlert(String candidateName, String vacancyTitle, String companyName, String salaryRange) {
        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>A new job opportunity has been posted that matches your profile!</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p><strong>Position:</strong> %s</p>
            <p><strong>Company:</strong> %s</p>
            <p><strong>Salary:</strong> %s</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Log in to your dashboard to view the full job description and apply.</p>
            """.formatted(candidateName, vacancyTitle, companyName,
                salaryRange != null ? salaryRange : "Competitive");
        return wrap("New Job Match Found!", content);
    }

    // ---------- Password reset ------------------------------
    public static String passwordReset(String name, String resetToken) {
        String content = """
            <p>Hi <strong>%s</strong>,</p>
            <p>We received a request to reset your password.</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>Use the token below to reset your password. 
               This token expires in <strong>15 minutes</strong>.</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; 
                      color: #4f46e5; text-align: center; padding: 16px; 
                      background: #e0e7ff; border-radius: 8px;">%s</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p>If you did not request a password reset, please ignore this email. 
               Your account is safe.</p>
            """.formatted(name, resetToken);
        return wrap("Password Reset Request", content);
    }
}
