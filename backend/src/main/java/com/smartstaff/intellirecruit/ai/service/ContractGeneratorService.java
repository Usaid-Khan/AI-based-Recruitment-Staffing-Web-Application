package com.smartstaff.intellirecruit.ai.service;

import com.smartstaff.intellirecruit.ai.dto.AiResponse;
import com.smartstaff.intellirecruit.ai.dto.ContractRequest;
import com.smartstaff.intellirecruit.entity.AiGeneratedContent;
import com.smartstaff.intellirecruit.entity.Candidate;
import com.smartstaff.intellirecruit.entity.Employer;
import com.smartstaff.intellirecruit.entity.Vacancy;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.kafka.event.AiEventBuilder;
import com.smartstaff.intellirecruit.kafka.producer.AiEventProducer;
import com.smartstaff.intellirecruit.repository.CandidateRepository;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.VacancyRepository;
import com.smartstaff.intellirecruit.service.AiContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class ContractGeneratorService {
    @Autowired
    private GeminiAiService geminiAiService;
    @Autowired
    private CandidateRepository candidateRepository;
    @Autowired
    private EmployerRepository employerRepository;
    @Autowired
    private VacancyRepository vacancyRepository;
    @Autowired
    private AiContentService aiContentService;
    @Autowired
    private AiEventProducer aiEventProducer;

    public AiResponse generateContract(ContractRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", request.getCandidateId()));

        Employer employer = employerRepository.findById(request.getEmployerId())
                .orElseThrow(() -> new ResourceNotFoundException("Employer", request.getEmployerId()));

        Vacancy vacancy = null;
        if (request.getVacancyId() != null) {
            vacancy = vacancyRepository.findById(request.getVacancyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vacancy", request.getVacancyId()));
        }

        String prompt = buildPrompt(candidate, employer, vacancy, request);
        String generatedContract = geminiAiService.generate(prompt);

        String triggeredBy = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        // Notify both candidate and employer — send to candidate
        aiEventProducer.publishAiGeneratedEvent(
                AiEventBuilder.build(
                        "CONTRACT",
                        request.getCandidateId(),
                        generatedContract,
                        triggeredBy,
                        candidate.getUser().getEmail(),
                        candidate.getUser().getName()
                )
        );

//        aiContentService.save(
//                AiGeneratedContent.ContentType.CONTRACT,
//                generatedContract,
//                request.getCandidateId()
//        );

        return AiResponse.builder()
                .content(generatedContract)
                .type("CONTRACT")
                .entityId(request.getCandidateId())
                .saved(true)
                .build();
    }

    private String buildPrompt(Candidate candidate, Employer employer, Vacancy vacancy, ContractRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Generate a professional employment contract.\n\n");

        prompt.append("CONTRACT PARTIES:\n");
        prompt.append("Employee (Candidate): ").append(candidate.getUser().getName()).append("\n");
        prompt.append("Employer/Company: ").append(employer.getCompanyName()).append("\n");
        prompt.append("Industry: ").append(
                employer.getIndustry() != null ? employer.getIndustry() : "N/A"
        ).append("\n\n");

        prompt.append("POSITION DETAILS:\n");
        if (vacancy != null) {
            prompt.append("Job Title: ").append(vacancy.getTitle()).append("\n");
        }
        prompt.append("Start Date: ").append(
                request.getStartDate() != null
                        ? request.getStartDate().toString()
                        : LocalDate.now().plusWeeks(2).toString()
        ).append("\n");
        prompt.append("Contract Duration: ").append(
                request.getContractDuration() != null ? request.getContractDuration() : "Permanent"
        ).append("\n");
        prompt.append("Salary/Compensation: ").append(
                request.getSalaryAmount() != null ? request.getSalaryAmount() : "As agreed"
        ).append("\n\n");

        prompt.append("GENERATE A CONTRACT WITH THESE SECTIONS:\n");
        prompt.append("1. Contract Header (parties, date, reference number)\n");
        prompt.append("2. Position and Duties\n");
        prompt.append("3. Commencement Date and Duration\n");
        prompt.append("4. Remuneration and Benefits\n");
        prompt.append("5. Working Hours and Location\n");
        prompt.append("6. Leave Entitlements\n");
        prompt.append("7. Confidentiality Clause\n");
        prompt.append("8. Termination Conditions\n");
        prompt.append("9. Dispute Resolution\n");
        prompt.append("10. Signature Block (Employee, Employer, Witness, Date)\n");

        if (request.getAdditionalTerms() != null && !request.getAdditionalTerms().isBlank()) {
            prompt.append("\nADDITIONAL TERMS TO INCLUDE:\n");
            prompt.append(request.getAdditionalTerms()).append("\n");
        }

        prompt.append("\nIMPORTANT: Generate a complete, legally-structured contract template. ");
        prompt.append("Use [PLACEHOLDER] for any values that need to be filled in manually. ");
        prompt.append("Output only the contract document.");

        return prompt.toString();
    }
}
