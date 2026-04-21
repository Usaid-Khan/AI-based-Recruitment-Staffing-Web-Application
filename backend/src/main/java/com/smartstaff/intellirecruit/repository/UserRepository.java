package com.smartstaff.intellirecruit.repository;

import com.smartstaff.intellirecruit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

//    User findByName(String name);

    boolean existsByEmail(String email);

    long countByRole(User.Role role);
}