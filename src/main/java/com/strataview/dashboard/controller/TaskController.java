package com.strataview.dashboard.controller;

import com.strataview.dashboard.model.Task;
import com.strataview.dashboard.model.TaskStatus;
import com.strataview.dashboard.repository.TaskRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskRepository.save(task);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public Task updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
        TaskStatus taskStatus = TaskStatus.valueOf(status.toUpperCase().trim());
        return taskRepository.findById(id)
                .map(task -> {
                    task.setStatus(taskStatus);
                    return taskRepository.save(task);
                })
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id " + id));
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        return taskRepository.findById(id)
                .map(task -> {
                    if (updatedTask.getTitle() != null) {
                        task.setTitle(updatedTask.getTitle());
                    }
                    if (updatedTask.getStoryPoint() != null) {
                        task.setStoryPoint(updatedTask.getStoryPoint());
                    }
                    if (updatedTask.getStrategicTargetId() != null) {
                        task.setStrategicTargetId(updatedTask.getStrategicTargetId());
                    }
                    if (updatedTask.getStatus() != null) {
                        task.setStatus(updatedTask.getStatus());
                    }
                    return taskRepository.save(task);
                })
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id " + id));
    }
}
