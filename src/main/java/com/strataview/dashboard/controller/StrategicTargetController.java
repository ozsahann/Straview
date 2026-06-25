package com.strataview.dashboard.controller;

import com.strataview.dashboard.model.StrategicTarget;
import com.strataview.dashboard.repository.StrategicTargetRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/targets")
@CrossOrigin(origins = "*")
public class StrategicTargetController {

    private final StrategicTargetRepository targetRepository;

    public StrategicTargetController(StrategicTargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    @GetMapping
    public List<StrategicTarget> getAllTargets() {
        return targetRepository.findAll();
    }

    @PostMapping
    public StrategicTarget createTarget(@RequestBody StrategicTarget target) {
        return targetRepository.save(target);
    }

    @PutMapping("/{id}")
    public StrategicTarget updateTarget(@PathVariable Long id, @RequestBody StrategicTarget updatedTarget) {
        return targetRepository.findById(id)
                .map(target -> {
                    target.setTargetPercentage(updatedTarget.getTargetPercentage());
                    if (updatedTarget.getName() != null) {
                        target.setName(updatedTarget.getName());
                    }
                    return targetRepository.save(target);
                })
                .orElseThrow(() -> new IllegalArgumentException("Target not found with id " + id));
    }
}
