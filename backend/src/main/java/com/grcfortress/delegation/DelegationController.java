package com.grcfortress.delegation;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/delegations")
public class DelegationController {

    private final DelegationService delegationService;

    public DelegationController(DelegationService delegationService) {
        this.delegationService = delegationService;
    }

    @GetMapping("/given")
    public List<DelegationDto> given(Principal principal) {
        return delegationService.myDelegationsGiven(principal.getName()).stream()
                .map(this::toDto).toList();
    }

    @GetMapping("/received")
    public List<DelegationDto> received(Principal principal) {
        return delegationService.myDelegationsReceived(principal.getName()).stream()
                .map(this::toDto).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DelegationDto create(@RequestBody DelegationService.CreateRequest req, Principal principal) {
        return toDto(delegationService.create(principal.getName(), req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id, Principal principal) {
        delegationService.revoke(id, principal.getName());
    }

    private DelegationDto toDto(AuthorityDelegation d) {
        return new DelegationDto(
                d.getId(), d.getDelegatorUsername(), d.getDelegateUsername(),
                d.getReason(), d.getValidFrom(), d.getValidUntil(),
                d.isActive(), d.getCreatedAt()
        );
    }

    public record DelegationDto(
            Long id,
            String delegatorUsername,
            String delegateUsername,
            String reason,
            LocalDate validFrom,
            LocalDate validUntil,
            boolean isActive,
            Instant createdAt
    ) {}
}
