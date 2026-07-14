package com.strataview.dashboard.service;

import com.strataview.dashboard.dto.DashboardDTO;
import com.strataview.dashboard.dto.DashboardDTO.TargetStatusDTO;
import com.strataview.dashboard.model.StrategicTarget;
import com.strataview.dashboard.model.Task;
import com.strataview.dashboard.model.TaskStatus;
import com.strataview.dashboard.repository.StrategicTargetRepository;
import com.strataview.dashboard.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AlignmentService {

    private final StrategicTargetRepository targetRepository;
    private final TaskRepository taskRepository;

    public AlignmentService(StrategicTargetRepository targetRepository, TaskRepository taskRepository) {
        this.targetRepository = targetRepository;
        this.taskRepository = taskRepository;
    }

    public DashboardDTO calculateAlignment() {
        List<StrategicTarget> targets = targetRepository.findAll();
        List<Task> tasks = taskRepository.findAll();

        // Planned actual calculations (IN_PROGRESS and DONE tasks only)
        int totalStoryPoints = tasks.stream()
                .filter(t -> !TaskStatus.TODO.equals(t.getStatus()))
                .mapToInt(Task::getStoryPoint)
                .sum();

        // Completed actual calculations (DONE tasks only)
        int totalCompletedStoryPoints = tasks.stream()
                .filter(t -> TaskStatus.DONE.equals(t.getStatus()))
                .mapToInt(Task::getStoryPoint)
                .sum();

        List<TargetStatusDTO> targetStatuses = new ArrayList<>();
        double totalAbsoluteGap = 0.0;
        double totalCompletedAbsoluteGap = 0.0;
        boolean isMisaligned = false;
        boolean isCompletedMisaligned = false;

        for (StrategicTarget target : targets) {
            // Planned story points for this target (excluding TODO tasks)
            int targetStoryPoints = tasks.stream()
                    .filter(t -> target.getId().equals(t.getStrategicTargetId()) && !TaskStatus.TODO.equals(t.getStatus()))
                    .mapToInt(Task::getStoryPoint)
                    .sum();

            // Completed story points for this target
            int targetCompletedStoryPoints = tasks.stream()
                    .filter(t -> target.getId().equals(t.getStrategicTargetId()) && TaskStatus.DONE.equals(t.getStatus()))
                    .mapToInt(Task::getStoryPoint)
                    .sum();

            // Planned actual percentage
            double actualPercentage = 0.0;
            if (totalStoryPoints > 0) {
                actualPercentage = ((double) targetStoryPoints / totalStoryPoints) * 100;
                actualPercentage = Math.round(actualPercentage * 10.0) / 10.0;
            }

            // Completed actual percentage
            double completedPercentage = 0.0;
            if (totalCompletedStoryPoints > 0) {
                completedPercentage = ((double) targetCompletedStoryPoints / totalCompletedStoryPoints) * 100;
                completedPercentage = Math.round(completedPercentage * 10.0) / 10.0;
            }

            // Alignment gaps
            double alignmentGap = target.getTargetPercentage() - actualPercentage;
            alignmentGap = Math.round(alignmentGap * 10.0) / 10.0;

            double completedAlignmentGap = target.getTargetPercentage() - completedPercentage;
            completedAlignmentGap = Math.round(completedAlignmentGap * 10.0) / 10.0;

            targetStatuses.add(new TargetStatusDTO(
                    target.getId(),
                    target.getName(),
                    target.getTargetPercentage(),
                    actualPercentage,
                    alignmentGap,
                    completedPercentage,
                    completedAlignmentGap
            ));

            totalAbsoluteGap += Math.abs(alignmentGap);
            totalCompletedAbsoluteGap += Math.abs(completedAlignmentGap);

            if (Math.abs(alignmentGap) > 15.0) {
                isMisaligned = true;
            }
            if (Math.abs(completedAlignmentGap) > 15.0) {
                isCompletedMisaligned = true;
            }
        }

        // Planned alignment score (defaults to 100 if no active tasks exist)
        int alignmentScore = 100;
        if (!targetStatuses.isEmpty() && totalStoryPoints > 0) {
            alignmentScore = (int) Math.round(100.0 - (totalAbsoluteGap / 2.0));
            alignmentScore = Math.max(0, Math.min(100, alignmentScore));
        }

        // Completed alignment score (default to 100 if no completed tasks exist)
        int completedAlignmentScore = 100;
        if (!targetStatuses.isEmpty() && totalCompletedStoryPoints > 0) {
            completedAlignmentScore = (int) Math.round(100.0 - (totalCompletedAbsoluteGap / 2.0));
            completedAlignmentScore = Math.max(0, Math.min(100, completedAlignmentScore));
        }

        String status = isMisaligned ? "Misaligned" : "Aligned";
        String completedStatus = isCompletedMisaligned ? "Misaligned" : "Aligned";

        return new DashboardDTO(alignmentScore, status, completedAlignmentScore, completedStatus, targetStatuses);
    }
}
