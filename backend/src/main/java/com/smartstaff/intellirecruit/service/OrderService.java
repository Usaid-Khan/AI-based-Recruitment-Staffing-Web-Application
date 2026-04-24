package com.smartstaff.intellirecruit.service;

import com.smartstaff.intellirecruit.dto.order.OrderDto;
import com.smartstaff.intellirecruit.dto.order.OrderRequest;
import com.smartstaff.intellirecruit.entity.Employer;
import com.smartstaff.intellirecruit.entity.Order;
import com.smartstaff.intellirecruit.entity.User;
import com.smartstaff.intellirecruit.exception.ResourceNotFoundException;
import com.smartstaff.intellirecruit.exception.UnauthorizedAccessException;
import com.smartstaff.intellirecruit.repository.EmployerRepository;
import com.smartstaff.intellirecruit.repository.OrderRepository;
import com.smartstaff.intellirecruit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmployerRepository employerRepository;

    @Transactional
    public OrderDto create(Long employerId, OrderRequest request) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));

        Order order = Order.builder()
                .employer(employer)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(Order.Status.PENDING)
                .shortlistedCandidates(request.getShortlistedCandidates())
                .build();

        return toDto(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderDto getById(Long id) {
        return toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAll() {
        return orderRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getByEmployer(Long employerId) {
        return orderRepository.findByEmployerId(employerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public OrderDto updateStatus(Long id, Order.Status status) {
        Order order = findById(id);
        verifyOwnershipOrAdmin(order.getEmployer().getUser().getEmail());
        order.setStatus(status);
        return toDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto updateShortlist(Long id, List<Long> candidateIds) {
        Order order = findById(id);
        verifyOwnershipOrAdmin(order.getEmployer().getUser().getEmail());
        order.setShortlistedCandidates(candidateIds);
        return toDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto update(Long id, OrderRequest request) {
        Order order = findById(id);
        verifyOwnershipOrAdmin(order.getEmployer().getUser().getEmail());

        if (request.getTitle() != null) order.setTitle(request.getTitle());
        if (request.getDescription() != null) order.setDescription(request.getDescription());
        if (request.getShortlistedCandidates() != null)
            order.setShortlistedCandidates(request.getShortlistedCandidates());

        return toDto(orderRepository.save(order));
    }

    @Transactional
    public void delete(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Order", id);
        }
        orderRepository.deleteById(id);
    }


    // ---------- Helpers --------------------------------------------------

    private void verifyOwnershipOrAdmin(String ownerEmail) {
        String currentEmail = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = currentEmail.equals(ownerEmail);

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedAccessException("You are not allowed to modify this resource");
        }
    }

    private Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    public OrderDto toDto(Order o) {
        return OrderDto.builder()
                .id(o.getId())
                .employerId(o.getEmployer().getId())
                .companyName(o.getEmployer().getCompanyName())
                .title(o.getTitle())
                .description(o.getDescription())
                .status(o.getStatus())
                .shortlistedCandidates(o.getShortlistedCandidates())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
