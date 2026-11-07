package com.taskmanager.realtime;

import com.taskmanager.service.TaskDomainEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TaskRealtimeEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    public TaskRealtimeEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(TaskDomainEvent event) {
        messagingTemplate.convertAndSendToUser(
                event.ownerEmail(), "/queue/tasks", event.payload());
    }
}
