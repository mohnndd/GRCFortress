package com.grcfortress.user;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/roles")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository permissionRepository;
    private final RequestMappingHandlerMapping handlerMapping;

    public RoleController(RoleRepository roleRepository,
                          RolePermissionRepository permissionRepository,
                          @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.handlerMapping = handlerMapping;
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    public record RoleDto(Long id, String name, String description, boolean isSystem, boolean isActive) {}

    public record PermissionDto(Long id, Long roleId, String roleName, String httpMethod, String pathPattern, String label) {}

    public record EndpointDto(String httpMethod, String pathPattern, String controller) {}

    public record CreateRoleRequest(String name, String description) {}

    public record UpdateRoleRequest(String description, boolean isActive) {}

    public record AddPermissionRequest(String httpMethod, String pathPattern, String label) {}

    // ── Roles CRUD ─────────────────────────────────────────────────────────

    @GetMapping
    public List<RoleDto> listRoles() {
        return roleRepository.findAll().stream()
                .map(r -> new RoleDto(r.getId(), r.getName(), r.getDescription(), r.isSystem(), r.isActive()))
                .sorted(Comparator.comparing(RoleDto::name))
                .toList();
    }

    @PostMapping
    public RoleDto createRole(@RequestBody CreateRoleRequest req) {
        Role role = new Role(req.name().toUpperCase().replace(" ", "_"), req.description());
        role = roleRepository.save(role);
        return new RoleDto(role.getId(), role.getName(), role.getDescription(), role.isSystem(), role.isActive());
    }

    @PutMapping("/{id}")
    public RoleDto updateRole(@PathVariable Long id, @RequestBody UpdateRoleRequest req) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        if (role.isSystem()) throw new IllegalStateException("System roles cannot be modified.");
        role.setDescription(req.description());
        role.setActive(req.isActive());
        role = roleRepository.save(role);
        return new RoleDto(role.getId(), role.getName(), role.getDescription(), role.isSystem(), role.isActive());
    }

    @DeleteMapping("/{id}")
    public void deleteRole(@PathVariable Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        if (role.isSystem()) throw new IllegalStateException("System roles cannot be deleted.");
        roleRepository.deleteById(id);
    }

    // ── Permissions ────────────────────────────────────────────────────────

    @GetMapping("/{id}/permissions")
    public List<PermissionDto> listPermissions(@PathVariable Long id) {
        return permissionRepository.findByRoleId(id).stream()
                .map(p -> new PermissionDto(p.getId(), p.getRole().getId(), p.getRole().getName(),
                        p.getHttpMethod(), p.getPathPattern(), p.getLabel()))
                .toList();
    }

    @PostMapping("/{id}/permissions")
    public PermissionDto addPermission(@PathVariable Long id, @RequestBody AddPermissionRequest req,
                                       @AuthenticationPrincipal UserDetails principal) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        RolePermission perm = new RolePermission();
        perm.setRole(role);
        perm.setHttpMethod(req.httpMethod() != null ? req.httpMethod().toUpperCase() : "ANY");
        perm.setPathPattern(req.pathPattern());
        perm.setLabel(req.label());
        perm.setCreatedBy(principal.getUsername());
        perm = permissionRepository.save(perm);
        return new PermissionDto(perm.getId(), role.getId(), role.getName(),
                perm.getHttpMethod(), perm.getPathPattern(), perm.getLabel());
    }

    @DeleteMapping("/permissions/{permId}")
    public void deletePermission(@PathVariable Long permId) {
        permissionRepository.deleteById(permId);
    }

    // ── Dynamic endpoint listing ───────────────────────────────────────────

    @GetMapping("/endpoints")
    public List<EndpointDto> listEndpoints() {
        return handlerMapping.getHandlerMethods().entrySet().stream()
                .filter(e -> {
                    String pattern = e.getKey().getPatternValues().stream().findFirst().orElse("");
                    return pattern.startsWith("/api/");
                })
                .flatMap(e -> {
                    Set<org.springframework.web.bind.annotation.RequestMethod> methods = e.getKey().getMethodsCondition().getMethods();
                    String pattern = e.getKey().getPatternValues().stream().findFirst().orElse("?");
                    String controller = e.getValue().getBeanType().getSimpleName();
                    if (methods.isEmpty()) {
                        return List.of(new EndpointDto("ANY", pattern, controller)).stream();
                    }
                    return methods.stream().map(m -> new EndpointDto(m.name(), pattern, controller));
                })
                .sorted(Comparator.comparing(EndpointDto::pathPattern).thenComparing(EndpointDto::httpMethod))
                .collect(Collectors.toList());
    }
}
