package com.strataview.dashboard.controller;

import com.strataview.dashboard.dto.DashboardDTO;
import com.strataview.dashboard.service.AlignmentService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final AlignmentService alignmentService;

    public DashboardController(AlignmentService alignmentService) {
        this.alignmentService = alignmentService;
    }

    @GetMapping
    public DashboardDTO getDashboardData() {
        return alignmentService.calculateAlignment();
    }
}
