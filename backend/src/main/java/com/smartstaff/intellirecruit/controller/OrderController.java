package com.smartstaff.intellirecruit.controller;

import com.smartstaff.intellirecruit.dto.order.OrderDto;
import com.smartstaff.intellirecruit.dto.order.OrderRequest;
import com.smartstaff.intellirecruit.entity.Order;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import com.smartstaff.intellirecruit.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmployerRepository employerRepository;

    // Admin: get all orders
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDto>> getAll() {
        return ResponseEntity.ok(orderService.getAll());
    }

    // Get order by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<OrderDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    // Get orders for a specific employer
    @GetMapping("/employer/{employerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<List<OrderDto>> getByEmployer(@PathVariable Long employerId) {
        return ResponseEntity.ok(orderService.getByEmployer(employerId));
    }

    // Employer: get own orders
    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = getUser(email);
        Long employerId = getEmployerId(user.getId());

        return ResponseEntity.ok(orderService.getByEmployer(employerId));
    }

    // Employer/Admin: create order
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<OrderDto> create(@Valid @RequestBody OrderRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = getUser(email);
        Long employerId = getEmployerId(user.getId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderService.create(employerId, request));
    }

    // Employer/Admin: update order
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<OrderDto> update(@PathVariable Long id, @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.update(id, request));
    }

    // Employer/Admin: update order status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<OrderDto> updateStatus(@PathVariable Long id, @RequestParam Order.Status status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    // Employer/Admin: update shortlisted candidates on an order
    @PatchMapping("/{id}/shortlist")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<OrderDto> updateShortlist(@PathVariable Long id, @RequestBody List<Long> candidateIds) {
        return ResponseEntity.ok(orderService.updateShortlist(id, candidateIds));
    }

    // Admin: delete order
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }


    // ---------- Helpers -------------------------------------------------

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Long getEmployerId(Long userId) {
        return employerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employer profile not found. Please create your profile first."))
                .getId();
    }
}
