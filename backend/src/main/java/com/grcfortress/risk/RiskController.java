package com.grcfortress.risk;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.risk.dto.RiskSummary;

@RestController
@RequestMapping("/api/v1/risks")
public class RiskController {

    private final RiskService riskService;

    public RiskController(RiskService riskService) {
        this.riskService = riskService;
    }

    @GetMapping("/domains")
    public List<RiskDomain> getDomains() {
        return riskService.listDomains();
    }

    @GetMapping
    public List<RiskSummary> list() {
        return riskService.listRisks();
    }

    @GetMapping("/{id}")
    public RiskSummary get(@PathVariable Long id) {
        return riskService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public RiskSummary create(@RequestBody RiskService.RiskCreateRequest req) {
        return riskService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RiskSummary update(@PathVariable Long id, @RequestBody RiskService.RiskCreateRequest req) {
        return riskService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        riskService.delete(id);
    }

    @GetMapping("/export")
    public void exportCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"risks.csv\"");
        var writer = response.getWriter();
        writer.println("Risk Number,Title,Domain,Category,Status,Inherent Score,Residual Score,Owner,Next Review");
        for (RiskSummary r : riskService.listRisks()) {
            writer.printf("%s,%s,%s,%s,%s,%d,%d,%s,%s%n",
                    csv(r.riskNumber()), csv(r.title()),
                    csv(r.domainName()), csv(r.categoryName()),
                    csv(r.status()), r.inherentScore(), r.residualScore(),
                    csv(r.riskOwnerUsername()),
                    r.nextReviewDate() != null ? r.nextReviewDate() : "");
        }
    }

    private static String csv(String v) {
        if (v == null) return "";
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
