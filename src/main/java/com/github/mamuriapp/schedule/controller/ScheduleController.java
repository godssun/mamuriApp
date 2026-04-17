package com.github.mamuriapp.schedule.controller;

import com.github.mamuriapp.global.dto.ApiResponse;
import com.github.mamuriapp.schedule.dto.ScheduleCreateRequest;
import com.github.mamuriapp.schedule.dto.ScheduleResponse;
import com.github.mamuriapp.schedule.dto.ScheduleUpdateRequest;
import com.github.mamuriapp.schedule.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleResponse>> create(
            Authentication authentication,
            @Valid @RequestBody ScheduleCreateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        ScheduleResponse response = scheduleService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> list(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Long userId = (Long) authentication.getPrincipal();
        List<ScheduleResponse> schedules = scheduleService.listInRange(userId, from, to);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> today(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(scheduleService.listToday(userId)));
    }

    @PutMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<ScheduleResponse>> update(
            Authentication authentication,
            @PathVariable Long scheduleId,
            @Valid @RequestBody ScheduleUpdateRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        ScheduleResponse response = scheduleService.update(userId, scheduleId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            Authentication authentication,
            @PathVariable Long scheduleId) {
        Long userId = (Long) authentication.getPrincipal();
        scheduleService.delete(userId, scheduleId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{scheduleId}/toggle-complete")
    public ResponseEntity<ScheduleResponse> toggleComplete(
            Authentication auth,
            @PathVariable Long scheduleId) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(scheduleService.toggleComplete(userId, scheduleId));
    }
}
