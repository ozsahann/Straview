package com.strataview.dashboard.repository;

import com.strataview.dashboard.model.StrategicTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StrategicTargetRepository extends JpaRepository<StrategicTarget, Long> {
}
