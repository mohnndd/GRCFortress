package com.grcfortress.policy.dto;

public record PolicyVersionFileDto(
        Long id,
        String fileName,
        String fileType,
        Long fileSizeBytes,
        int sortOrder
) {
}
