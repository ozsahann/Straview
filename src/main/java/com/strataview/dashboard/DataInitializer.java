package com.strataview.dashboard;

import com.strataview.dashboard.dto.DashboardDTO;
import com.strataview.dashboard.model.StrategicTarget;
import com.strataview.dashboard.model.Task;
import com.strataview.dashboard.repository.StrategicTargetRepository;
import com.strataview.dashboard.repository.TaskRepository;
import com.strataview.dashboard.service.AlignmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final StrategicTargetRepository targetRepository;
    private final TaskRepository taskRepository;
    private final AlignmentService alignmentService;

    public DataInitializer(StrategicTargetRepository targetRepository, 
                           TaskRepository taskRepository, 
                           AlignmentService alignmentService) {
        this.targetRepository = targetRepository;
        this.taskRepository = taskRepository;
        this.alignmentService = alignmentService;
    }

    @Override
    public void run(String... args) throws Exception {
        if (targetRepository.count() == 0) {
            logger.info("Veri tabanı boş. Demo verileri yükleniyor...");

            // Save targets
            StrategicTarget target1 = targetRepository.save(new StrategicTarget("Müşteri Sadakatini Artırma", 40.0));
            StrategicTarget target2 = targetRepository.save(new StrategicTarget("Çekirdek Altyapı ve Teknik Borç", 20.0));
            StrategicTarget target3 = targetRepository.save(new StrategicTarget("Kurumsal 5G Yayılımı", 40.0));

            // Save tasks linked to target IDs
            taskRepository.save(new Task("Giriş ekranı zaman aşımı hatasını düzelt", 5, target1.getId()));
            taskRepository.save(new Task("Veritabanı bağlantı havuzunu (pooling) yeniden yapılandır", 13, target2.getId()));
            taskRepository.save(new Task("Spring Boot ve çekirdek kütüphaneleri yükselt", 8, target2.getId()));
            taskRepository.save(new Task("Eski bildirim mikro servisini yeniden yaz", 13, target2.getId()));
            taskRepository.save(new Task("5G onboarding dokümantasyonunu taslak haline getir", 3, target3.getId()));
            taskRepository.save(new Task("API yanıt sürelerini optimize et", 5, target1.getId()));

            logger.info("Demo verileri başarıyla yüklendi.");
        } else {
            logger.info("Veri tabanında zaten veri mevcut. Yükleme atlanıyor.");
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
