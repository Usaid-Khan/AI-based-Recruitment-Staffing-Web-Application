package com.smartstaff.intellirecruit.enums;

public enum Status {
    // For Vacancy
    OPEN, CLOSED, DRAFT,

    // For Order
    PENDING, IN_PROGRESS, FULFILLED, CANCELLED,

    // For Application
    APPLIED, SHORTLISTED, INTERVIEWED, OFFERED, REJECTED, WITHDRAWN
}
