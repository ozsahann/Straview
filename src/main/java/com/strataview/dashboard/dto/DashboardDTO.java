package com.strataview.dashboard.dto;

import com.strataview.dashboard.model.Sprint;

import java.util.List;

public class DashboardDTO {

    private int alignmentScore;
    private String status;
    private int completedAlignmentScore;
    private String completedStatus;
    private List<TargetStatusDTO> targetStatuses;
    private List<Sprint> sprints;

    public DashboardDTO() {
    }

    public DashboardDTO(int alignmentScore, String status, int completedAlignmentScore, String completedStatus, List<TargetStatusDTO> targetStatuses) {
        this.alignmentScore = alignmentScore;
        this.status = status;
        this.completedAlignmentScore = completedAlignmentScore;
        this.completedStatus = completedStatus;
        this.targetStatuses = targetStatuses;
    }

    public DashboardDTO(int alignmentScore, String status, int completedAlignmentScore, String completedStatus, List<TargetStatusDTO> targetStatuses, List<Sprint> sprints) {
        this.alignmentScore = alignmentScore;
        this.status = status;
        this.completedAlignmentScore = completedAlignmentScore;
        this.completedStatus = completedStatus;
        this.targetStatuses = targetStatuses;
        this.sprints = sprints;
    }

    public int getAlignmentScore() {
        return alignmentScore;
    }

    public void setAlignmentScore(int alignmentScore) {
        this.alignmentScore = alignmentScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getCompletedAlignmentScore() {
        return completedAlignmentScore;
    }

    public void setCompletedAlignmentScore(int completedAlignmentScore) {
        this.completedAlignmentScore = completedAlignmentScore;
    }

    public String getCompletedStatus() {
        return completedStatus;
    }

    public void setCompletedStatus(String completedStatus) {
        this.completedStatus = completedStatus;
    }

    public List<TargetStatusDTO> getTargetStatuses() {
        return targetStatuses;
    }

    public void setTargetStatuses(List<TargetStatusDTO> targetStatuses) {
        this.targetStatuses = targetStatuses;
    }

    public List<Sprint> getSprints() {
        return sprints;
    }

    public void setSprints(List<Sprint> sprints) {
        this.sprints = sprints;
    }

    public static class TargetStatusDTO {
        private Long targetId;
        private String targetName;
        private Double targetPercentage;
        private Double actualPercentage;
        private Double alignmentGap;
        private Double completedPercentage;
        private Double completedAlignmentGap;

        public TargetStatusDTO() {
        }

        public TargetStatusDTO(Long targetId, String targetName, Double targetPercentage, Double actualPercentage, Double alignmentGap, Double completedPercentage, Double completedAlignmentGap) {
            this.targetId = targetId;
            this.targetName = targetName;
            this.targetPercentage = targetPercentage;
            this.actualPercentage = actualPercentage;
            this.alignmentGap = alignmentGap;
            this.completedPercentage = completedPercentage;
            this.completedAlignmentGap = completedAlignmentGap;
        }

        public Long getTargetId() {
            return targetId;
        }

        public void setTargetId(Long targetId) {
            this.targetId = targetId;
        }

        public String getTargetName() {
            return targetName;
        }

        public void setTargetName(String targetName) {
            this.targetName = targetName;
        }

        public Double getTargetPercentage() {
            return targetPercentage;
        }

        public void setTargetPercentage(Double targetPercentage) {
            this.targetPercentage = targetPercentage;
        }

        public Double getActualPercentage() {
            return actualPercentage;
        }

        public void setActualPercentage(Double actualPercentage) {
            this.actualPercentage = actualPercentage;
        }

        public Double getAlignmentGap() {
            return alignmentGap;
        }

        public void setAlignmentGap(Double alignmentGap) {
            this.alignmentGap = alignmentGap;
        }

        public Double getCompletedPercentage() {
            return completedPercentage;
        }

        public void setCompletedPercentage(Double completedPercentage) {
            this.completedPercentage = completedPercentage;
        }

        public Double getCompletedAlignmentGap() {
            return completedAlignmentGap;
        }

        public void setCompletedAlignmentGap(Double completedAlignmentGap) {
            this.completedAlignmentGap = completedAlignmentGap;
        }
    }
}
