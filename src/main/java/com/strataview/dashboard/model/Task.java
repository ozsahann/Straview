package com.strataview.dashboard.model;

import jakarta.persistence.Entity;
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

    public Task() {
    }

    public Task(String title, Integer storyPoint, Long strategicTargetId) {
        this.title = title;
        this.storyPoint = storyPoint;
        this.strategicTargetId = strategicTargetId;
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
}
