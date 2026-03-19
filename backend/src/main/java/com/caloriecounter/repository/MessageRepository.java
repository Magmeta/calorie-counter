package com.caloriecounter.repository;

import com.caloriecounter.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByUserIdOrderByCreatedAtAsc(Long userId);

    List<Message> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);
}
