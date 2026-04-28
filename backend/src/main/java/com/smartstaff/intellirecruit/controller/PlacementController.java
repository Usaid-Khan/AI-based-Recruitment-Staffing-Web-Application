package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.placement.PlacementDto;
import com.smartstaff.intellirecruit.dto.placement.PlacementRequest;
import com.smartstaff.intellirecruit.service.PlacementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/placements")
public class PlacementController {
    @Autowired
    private PlacementService placementService;

    // Admin: get all placements
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PlacementDto>> getAll() {
        return ResponseEntity.ok(placementService.getAll());
    }

    // Get placement by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<PlacementDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(placementService.getById(id));
    }

    // Get placements for a specific candidate
    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER', 'CANDIDATE')")
    public ResponseEntity<List<PlacementDto>> getByCandidate(@PathVariable Long candidateId) {
        return ResponseEntity.ok(placementService.getByCandidate(candidateId));
    }

    // Get placements for a specific employer
    @GetMapping("/employer/{employerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<List<PlacementDto>> getByEmployer(@PathVariable Long employerId) {
        return ResponseEntity.ok(placementService.getByEmployer(employerId));
    }

    // Admin: create a placement
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlacementDto> create(@Valid @RequestBody PlacementRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(placementService.create(request));
    }

    // Admin: attach or update contract URL on a placement
    @PatchMapping("/{id}/contract")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlacementDto> updateContract(@PathVariable Long id, @RequestParam String contractUrl) {
        return ResponseEntity.ok(placementService.updateContractUrl(id, contractUrl));
    }

    // Admin: delete placement
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        placementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
