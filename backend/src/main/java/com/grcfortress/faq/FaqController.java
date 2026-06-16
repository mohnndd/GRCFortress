package com.grcfortress.faq;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/faq")
public class FaqController {

    private final FaqRepository faqRepository;

    public FaqController(FaqRepository faqRepository) {
        this.faqRepository = faqRepository;
    }

    public record FaqRequest(String slug, String title, String content, int sortOrder, boolean isPublished) {}

    // Public: list published pages
    @GetMapping
    public List<FaqPage> listPublished() {
        return faqRepository.findAllByIsPublishedTrueOrderBySortOrderAsc();
    }

    // Admin: list all (including unpublished)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<FaqPage> listAll() {
        return faqRepository.findAllByOrderBySortOrderAsc();
    }

    @GetMapping("/{slug}")
    public FaqPage getBySlug(@PathVariable String slug) {
        return faqRepository.findBySlug(slug)
                .orElseThrow(() -> new NoSuchElementException("FAQ page not found: " + slug));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public FaqPage create(@RequestBody FaqRequest req, @AuthenticationPrincipal UserDetails principal) {
        FaqPage page = new FaqPage();
        page.setSlug(req.slug());
        page.setTitle(req.title());
        page.setContent(req.content());
        page.setSortOrder(req.sortOrder());
        page.setPublished(req.isPublished());
        page.setCreatedBy(principal.getUsername());
        page.setUpdatedBy(principal.getUsername());
        return faqRepository.save(page);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FaqPage update(@PathVariable Long id, @RequestBody FaqRequest req,
                          @AuthenticationPrincipal UserDetails principal) {
        FaqPage page = faqRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("FAQ page not found: " + id));
        page.setSlug(req.slug());
        page.setTitle(req.title());
        page.setContent(req.content());
        page.setSortOrder(req.sortOrder());
        page.setPublished(req.isPublished());
        page.setUpdatedBy(principal.getUsername());
        return faqRepository.save(page);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        faqRepository.deleteById(id);
    }
}
