package com.strataview.dashboard;

import com.strataview.dashboard.dto.DashboardDTO;
import com.strataview.dashboard.model.Sprint;
import com.strataview.dashboard.model.StrategicTarget;
import com.strataview.dashboard.model.Task;
import com.strataview.dashboard.model.TaskStatus;
import com.strataview.dashboard.repository.SprintRepository;
import com.strataview.dashboard.repository.StrategicTargetRepository;
import com.strataview.dashboard.repository.TaskRepository;
import com.strataview.dashboard.service.AlignmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final StrategicTargetRepository targetRepository;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final AlignmentService alignmentService;

    public DataInitializer(StrategicTargetRepository targetRepository, 
                           TaskRepository taskRepository, 
                           SprintRepository sprintRepository,
                           AlignmentService alignmentService) {
        this.targetRepository = targetRepository;
        this.taskRepository = taskRepository;
        this.sprintRepository = sprintRepository;
        this.alignmentService = alignmentService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Ensure Sprint records exist
        Sprint sprint1, sprint2, sprint3;
        if (sprintRepository.count() == 0) {
            logger.info("Sprint verisi bulunamadı. Örnek Sprint kayıtları oluşturuluyor...");
            sprint1 = sprintRepository.save(new Sprint("Sprint 1", "2026-06-01", "2026-06-15", false));
            sprint2 = sprintRepository.save(new Sprint("Sprint 2", "2026-06-16", "2026-06-30", true));
            sprint3 = sprintRepository.save(new Sprint("Sprint 3", "2026-07-01", "2026-07-15", false));
        } else {
            List<Sprint> sprints = sprintRepository.findAll();
            sprint1 = sprints.get(0);
            sprint2 = sprints.size() > 1 ? sprints.get(1) : sprint1;
            sprint3 = sprints.size() > 2 ? sprints.get(2) : sprint1;
        }

        if (targetRepository.count() == 0) {
            logger.info("Stratejik Hedefler boş. Demo verileri yükleniyor...");

            // Save targets
            StrategicTarget target1 = targetRepository.save(new StrategicTarget("Müşteri Sadakatini Artırma", 40.0));
            StrategicTarget target2 = targetRepository.save(new StrategicTarget("Çekirdek Altyapı ve Teknik Borç", 20.0));
            StrategicTarget target3 = targetRepository.save(new StrategicTarget("Kurumsal 5G Yayılımı", 40.0));

            // Save tasks linked to target IDs and sprint IDs
            taskRepository.save(new Task("Giriş ekranı zaman aşımı hatasını düzelt", 5, target1.getId(), sprint1.getId(), TaskStatus.DONE));
            taskRepository.save(new Task("Veritabanı bağlantı havuzunu (pooling) yeniden yapılandır", 13, target2.getId(), sprint2.getId(), TaskStatus.IN_PROGRESS));
            taskRepository.save(new Task("Spring Boot ve çekirdek kütüphaneleri yükselt", 8, target2.getId(), sprint3.getId(), TaskStatus.TODO));
            taskRepository.save(new Task("Eski bildirim mikro servisini yeniden yaz", 13, target2.getId(), sprint2.getId(), TaskStatus.TODO));
            taskRepository.save(new Task("5G onboarding dokümantasyonunu taslak haline getir", 3, target3.getId(), sprint1.getId(), TaskStatus.DONE));
            taskRepository.save(new Task("API yanıt sürelerini optimize et", 5, target1.getId(), sprint3.getId(), TaskStatus.TODO));

            logger.info("Demo verileri ve Sprint kayıtları başarıyla yüklendi.");
        } else {
            // Assign sprintId to existing tasks if missing
            List<Task> existingTasks = taskRepository.findAll();
            for (int i = 0; i < existingTasks.size(); i++) {
                Task task = existingTasks.get(i);
                if (task.getSprintId() == null) {
                    if (i % 3 == 0) task.setSprintId(sprint1.getId());
                    else if (i % 3 == 1) task.setSprintId(sprint2.getId());
                    else task.setSprintId(sprint3.getId());
                    taskRepository.save(task);
                }
            }
        }

        // Calculate and log initial alignment status
        DashboardDTO dashboard = alignmentService.calculateAlignment();
        logger.info("=========================================");
        logger.info("STRATAVIEW - BAŞLANGIÇ HİZALANMA RAPORU");
        logger.info("=========================================");
        logger.info("Genel Durum: {}", dashboard.getStatus());
        logger.info("Hizalanma Skoru: {}%", dashboard.getAlignmentScore());
        logger.info("-----------------------------------------");
        for (DashboardDTO.TargetStatusDTO targetStatus : dashboard.getTargetStatuses()) {
            logger.info("Hedef: {} | Hedef %: {}% | Gerçekleşen %: {}% | Sapma %: {}%",
                    targetStatus.getTargetName(),
                    targetStatus.getTargetPercentage(),
                    targetStatus.getActualPercentage(),
                    targetStatus.getAlignmentGap());
        }
        logger.info("=========================================");
    }
}
