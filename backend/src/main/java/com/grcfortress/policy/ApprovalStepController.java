package com.grcfortress.policy;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.grcfortress.policy.dto.DelegateRequest;
import com.grcfortress.policy.dto.MessageRequest;
import com.grcfortress.policy.dto.StepDecisionRequest;
import com.grcfortress.policy.dto.StepMessageDto;

@RestController
@RequestMapping("/api/v1/approval-steps")
public class ApprovalStepController {

    private final PolicyService policyService;

    public ApprovalStepController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @PostMapping("/{stepId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable Long stepId,
                        @RequestBody(required = false) StepDecisionRequest req,
                        java.security.Principal principal) {
        policyService.approveStep(stepId, req != null ? req.comments() : null, principal.getName());
    }

    @PostMapping("/{stepId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable Long stepId,
                       @RequestBody(required = false) StepDecisionRequest req,
                       java.security.Principal principal) {
        policyService.rejectStep(stepId, req != null ? req.comments() : null, principal.getName());
    }

    @PostMapping("/{stepId}/delegate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delegate(@PathVariable Long stepId,
                         @Valid @RequestBody DelegateRequest req,
                         java.security.Principal principal) {
        policyService.delegateStep(stepId, req.stakeholderId(), principal.getName());
    }

    @GetMapping("/{stepId}/messages")
    public List<StepMessageDto> getMessages(@PathVariable Long stepId) {
        return policyService.getMessages(stepId);
    }

    @PostMapping("/{stepId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public StepMessageDto postMessage(@PathVariable Long stepId,
                                      @Valid @RequestBody MessageRequest req,
                                      java.security.Principal principal) {
        return policyService.postMessage(stepId, req.message(), principal.getName());
    }
}
