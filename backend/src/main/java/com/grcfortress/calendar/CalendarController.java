package com.grcfortress.calendar;

import com.grcfortress.contract.ContractRepository;
import com.grcfortress.observation.ObservationRepository;
import com.grcfortress.risk.RiskRecordRepository;
import com.grcfortress.terms.TermsDocumentRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar")
public class CalendarController {

    record CalendarEvent(String date, String title, String type, Long sourceId) {}

    private final RiskRecordRepository riskRepo;
    private final ContractRepository contractRepo;
    private final ObservationRepository observationRepo;
    private final TermsDocumentRepository termsRepo;

    public CalendarController(RiskRecordRepository riskRepo,
                               ContractRepository contractRepo,
                               ObservationRepository observationRepo,
                               TermsDocumentRepository termsRepo) {
        this.riskRepo = riskRepo;
        this.contractRepo = contractRepo;
        this.observationRepo = observationRepo;
        this.termsRepo = termsRepo;
    }

    @GetMapping("/events")
    public List<CalendarEvent> events() {
        List<CalendarEvent> events = new ArrayList<>();

        // Risk review dates
        riskRepo.findAll().forEach(r -> {
            if (r.getNextReviewDate() != null) {
                events.add(new CalendarEvent(r.getNextReviewDate().toString(),
                        "Risk review: " + r.getTitle(), "RISK_REVIEW", r.getId()));
            }
        });

        // Contract end & renewal dates
        contractRepo.findAll().forEach(c -> {
            if (c.getEndDate() != null) {
                events.add(new CalendarEvent(c.getEndDate().toString(),
                        "Contract ends: " + c.getTitle(), "CONTRACT_END", c.getId()));
            }
            if (c.getRenewalDate() != null) {
                events.add(new CalendarEvent(c.getRenewalDate().toString(),
                        "Contract renewal: " + c.getTitle(), "CONTRACT_RENEWAL", c.getId()));
            }
        });

        // Observation target dates
        observationRepo.findAll().forEach(o -> {
            LocalDate target = o.getConfirmedTargetDate() != null
                    ? o.getConfirmedTargetDate() : o.getProposedTargetDate();
            if (target != null) {
                events.add(new CalendarEvent(target.toString(),
                        "Observation due: " + o.getName(), "OBSERVATION_DUE", o.getId()));
            }
        });

        // Terms review dates
        termsRepo.findAll().forEach(t -> {
            if (t.getNextReview() != null) {
                events.add(new CalendarEvent(t.getNextReview().toString(),
                        "Terms review: " + t.getTitle(), "TERMS_REVIEW", t.getId()));
            }
        });

        events.sort(Comparator.comparing(CalendarEvent::date));
        return events;
    }
}
