package com.smartstaff.intellirecruit.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/")
    public String greet() {
        return "Hello to AI-Powered Recruitment & Staffing Job Board";
    }
}
