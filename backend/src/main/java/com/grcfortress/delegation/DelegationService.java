package com.grcfortress.delegation;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DelegationService {

    private final AuthorityDelegationRepository repo;

    public DelegationService(AuthorityDelegationRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<AuthorityDelegation> myDelegationsGiven(String username) {
        return repo.findAllByDelegatorUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional(readOnly = true)
    public List<AuthorityDelegation> myDelegationsReceived(String username) {
        return repo.findAllByDelegateUsernameOrderByCreatedAtDesc(username);
    }

    public AuthorityDelegation create(String delegatorUsername, CreateRequest req) {
        AuthorityDelegation d = new AuthorityDelegation(
                delegatorUsername,
                req.delegateUsername(),
                req.reason(),
                req.validFrom(),
                req.validUntil()
        );
        return repo.save(d);
    }

    public void revoke(Long id, String currentUsername) {
        AuthorityDelegation d = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delegation not found: " + id));
        if (!d.getDelegatorUsername().equalsIgnoreCase(currentUsername)) {
            throw new IllegalStateException("You can only revoke your own delegations");
        }
        d.setActive(false);
        repo.save(d);
    }

    @Transactional(readOnly = true)
    public boolean isDelegatedBy(String delegatorUsername, String delegateUsername) {
        return repo.existsActiveByDelegatorAndDelegate(
                delegatorUsername.toLowerCase(),
                delegateUsername.toLowerCase(),
                LocalDate.now()
        );
    }

    public record CreateRequest(
            String delegateUsername,
            String reason,
            LocalDate validFrom,
            LocalDate validUntil
    ) {}
}
