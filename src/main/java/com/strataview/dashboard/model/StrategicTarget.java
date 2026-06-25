package com.strataview.dashboard.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "strategic_targets")
public class StrategicTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Double targetPercentage;

    public StrategicTarget() {
    }

    public StrategicTarget(String name, Double targetPercentage) {
        this.name = name;
        this.targetPercentage = targetPercentage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getTargetPercentage() {
        return targetPercentage;
    }

    public void setTargetPercentage(Double targetPercentage) {
        this.targetPercentage = targetPercentage;
    }
}
