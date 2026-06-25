package com.strataview.dashboard.service;

import com.strataview.dashboard.dto.DashboardDTO;
import com.strataview.dashboard.dto.DashboardDTO.TargetStatusDTO;
import com.strataview.dashboard.model.StrategicTarget;
import com.strataview.dashboard.model.Task;
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

        int totalStoryPoints = tasks.stream()
                .mapToInt(Task::getStoryPoint)
                .sum();

        List<TargetStatusDTO> targetStatuses = new ArrayList<>();
        double totalAbsoluteGap = 0.0;
        boolean isMisaligned = false;

        for (StrategicTarget target : targets) {
            int targetStoryPoints = tasks.stream()
                    .filter(t -> target.getId().equals(t.getStrategicTargetId()))
                    .mapToInt(Task::getStoryPoint)
                    .sum();

            double actualPercentage = 0.0;
            if (totalStoryPoints > 0) {
                actualPercentage = ((double) targetStoryPoints / totalStoryPoints) * 100;
                // Round to 1 decimal place
                actualPercentage = Math.round(actualPercentage * 10.0) / 10.0;
            }

            double alignmentGap = target.getTargetPercentage() - actualPercentage;
            alignmentGap = Math.round(alignmentGap * 10.0) / 10.0;

            targetStatuses.add(new TargetStatusDTO(
                    target.getId(),
                    target.getName(),
                    target.getTargetPercentage(),
                    actualPercentage,
                    alignmentGap
            ));

            totalAbsoluteGap += Math.abs(alignmentGap);

            if (Math.abs(alignmentGap) > 15.0) {
                isMisaligned = true;
            }
        }

        int alignmentScore = 100;
        if (!targetStatuses.isEmpty()) {
            // Deduct based on absolute gap. Max gap sum is 200%.
            // Scale: alignmentScore = 100 - (totalAbsoluteGap / 2)
            alignmentScore = (int) Math.round(100.0 - (totalAbsoluteGap / 2.0));
            alignmentScore = Math.max(0, Math.min(100, alignmentScore));
        }

        String status = isMisaligned ? "Misaligned" : "Aligned";

        return new DashboardDTO(alignmentScore, status, targetStatuses);
    }
}
