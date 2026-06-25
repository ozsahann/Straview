package com.strataview.dashboard.dto;

import java.util.List;

public class DashboardDTO {

    private int alignmentScore;
    private String status;
    private List<TargetStatusDTO> targetStatuses;

    public DashboardDTO() {
    }

    public DashboardDTO(int alignmentScore, String status, List<TargetStatusDTO> targetStatuses) {
        this.alignmentScore = alignmentScore;
        this.status = status;
        this.targetStatuses = targetStatuses;
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

    public List<TargetStatusDTO> getTargetStatuses() {
        return targetStatuses;
    }

    public void setTargetStatuses(List<TargetStatusDTO> targetStatuses) {
        this.targetStatuses = targetStatuses;
    }

    public static class TargetStatusDTO {
        private Long targetId;
        private String targetName;
        private Double targetPercentage;
        private Double actualPercentage;
        private Double alignmentGap;

        public TargetStatusDTO() {
        }

        public TargetStatusDTO(Long targetId, String targetName, Double targetPercentage, Double actualPercentage, Double alignmentGap) {
            this.targetId = targetId;
            this.targetName = targetName;
            this.targetPercentage = targetPercentage;
            this.actualPercentage = actualPercentage;
            this.alignmentGap = alignmentGap;
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
    }
}
