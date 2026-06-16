package com.grcfortress.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    @Query("SELECT rp FROM RolePermission rp JOIN FETCH rp.role WHERE rp.role.id = :roleId ORDER BY rp.pathPattern")
    List<RolePermission> findByRoleId(Long roleId);

    void deleteByRoleId(Long roleId);
}
