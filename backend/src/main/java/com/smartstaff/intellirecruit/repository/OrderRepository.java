package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByEmployerId(Long employerId);

    List<Order> findByStatus(Order.Status status);

    List<Order> findByEmployerIdAndStatus(Long employerId, Order.Status status);
}
