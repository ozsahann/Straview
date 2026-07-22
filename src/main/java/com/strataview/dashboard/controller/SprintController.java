package com.strataview.dashboard.controller;

import com.strataview.dashboard.model.Sprint;
import com.strataview.dashboard.repository.SprintRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@CrossOrigin(origins = "*")
public class SprintController {

    private final SprintRepository sprintRepository;

    public SprintController(SprintRepository sprintRepository) {
        this.sprintRepository = sprintRepository;
    }

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }
}
