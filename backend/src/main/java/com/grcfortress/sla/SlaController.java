package com.grcfortress.sla;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.sla.SlaService.ActiveStepStatus;

@RestController
@RequestMapping("/api/v1/sla")
public class SlaController {

    private final SlaService slaService;

    public SlaController(SlaService slaService) {
        this.slaService = slaService;
    }

    @GetMapping("/rules")
    public List<SlaRuleDto> getRules() {
        return slaService.getRules().stream()
                .map(r -> new SlaRuleDto(r.getId(), r.getProcessType(), r.getBusinessDaysPerStep()))
                .toList();
    }

    @PutMapping("/rules/{processType}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public SlaRuleDto updateRule(@PathVariable String processType,
                                  @RequestBody UpdateRuleRequest req) {
        SlaProcessRule rule = slaService.upsertRule(processType, req.businessDaysPerStep());
        return new SlaRuleDto(rule.getId(), rule.getProcessType(), rule.getBusinessDaysPerStep());
    }

    @GetMapping("/active-steps")
    public List<ActiveStepStatus> getActiveSteps() {
        return slaService.getActiveStepsStatus();
    }

    public record SlaRuleDto(Long id, String processType, int businessDaysPerStep) {}
    public record UpdateRuleRequest(int businessDaysPerStep) {}
}
