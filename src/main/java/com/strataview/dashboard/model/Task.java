package com.strataview.dashboard.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private Integer storyPoint;

    private Long strategicTargetId;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.TODO;

    public Task() {
    }

    public Task(String title, Integer storyPoint, Long strategicTargetId) {
        this.title = title;
        this.storyPoint = storyPoint;
        this.strategicTargetId = strategicTargetId;
        this.status = TaskStatus.TODO;
    }

    public Task(String title, Integer storyPoint, Long strategicTargetId, TaskStatus status) {
        this.title = title;
        this.storyPoint = storyPoint;
        this.strategicTargetId = strategicTargetId;
        this.status = status != null ? status : TaskStatus.TODO;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getStoryPoint() {
        return storyPoint;
    }

    public void setStoryPoint(Integer storyPoint) {
        this.storyPoint = storyPoint;
    }

    public Long getStrategicTargetId() {
        return strategicTargetId;
    }

    public void setStrategicTargetId(Long strategicTargetId) {
        this.strategicTargetId = strategicTargetId;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }
}
