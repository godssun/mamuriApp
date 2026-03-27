package com.github.mamuriapp.ai.controller;

import com.github.mamuriapp.ai.entity.UserMemory;
import com.github.mamuriapp.ai.service.MemoryExtractionService;
import com.github.mamuriapp.global.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 기억 API 컨트롤러.
 */
@RestController
@RequestMapping("/api/memories")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryExtractionService memoryService;

    @GetMapping
    public ApiResponse<List<MemoryResponse>> getMemories(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<MemoryResponse> memories = memoryService.getMemories(userId).stream()
                .map(MemoryResponse::from)
                .toList();
        return ApiResponse.success(memories);
    }

    @DeleteMapping("/{memoryId}")
    public ApiResponse<Void> deleteMemory(@PathVariable Long memoryId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        memoryService.archiveMemory(memoryId, userId);
        return ApiResponse.success();
    }

    record MemoryResponse(Long id, String memoryType, String content, int importance,
                          int mentionCount, String createdAt) {
        static MemoryResponse from(UserMemory m) {
            return new MemoryResponse(m.getId(), m.getMemoryType(), m.getContent(),
                    m.getImportance(), m.getMentionCount(),
                    m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
        }
    }
}
