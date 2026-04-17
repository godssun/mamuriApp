package com.github.mamuriapp.schedule.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.schedule.dto.ScheduleCreateRequest;
import com.github.mamuriapp.schedule.dto.ScheduleResponse;
import com.github.mamuriapp.schedule.dto.ScheduleUpdateRequest;
import com.github.mamuriapp.schedule.entity.Schedule;
import com.github.mamuriapp.schedule.repository.ScheduleRepository;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    @Transactional
    public ScheduleResponse create(Long userId, ScheduleCreateRequest request) {
        validateRange(request.getStartAt(), request.getEndAt());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Schedule schedule = Schedule.builder()
                .user(user)
                .title(request.getTitle().trim())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .note(request.getNote())
                .isAllDay(request.getIsAllDay())
                .linkedDiaryId(request.getLinkedDiaryId())
                .color(request.getColor())
                .build();

        scheduleRepository.save(schedule);
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public ScheduleResponse update(Long userId, Long scheduleId, ScheduleUpdateRequest request) {
        validateRange(request.getStartAt(), request.getEndAt());

        Schedule schedule = scheduleRepository.findByIdAndUserId(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.SCHEDULE_NOT_FOUND));

        schedule.update(
                request.getTitle().trim(),
                request.getStartAt(),
                request.getEndAt(),
                request.getNote(),
                request.getIsAllDay(),
                request.getLinkedDiaryId(),
                request.getColor()
        );
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public void delete(Long userId, Long scheduleId) {
        Schedule schedule = scheduleRepository.findByIdAndUserId(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.SCHEDULE_NOT_FOUND));
        scheduleRepository.delete(schedule);
    }

    @Transactional
    public ScheduleResponse toggleComplete(Long userId, Long scheduleId) {
        Schedule schedule = scheduleRepository.findByIdAndUserId(scheduleId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.SCHEDULE_NOT_FOUND));
        schedule.toggleComplete();
        return ScheduleResponse.from(schedule);
    }

    public List<ScheduleResponse> listInRange(Long userId, LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.now(KST);
        LocalDate endExclusive = (to != null ? to : start).plusDays(1);
        return scheduleRepository.findInRange(
                        userId,
                        start.atStartOfDay(),
                        endExclusive.atStartOfDay())
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    public List<ScheduleResponse> listToday(Long userId) {
        LocalDate today = LocalDate.now(KST);
        return scheduleRepository.findInRange(
                        userId,
                        today.atStartOfDay(),
                        today.plusDays(1).atStartOfDay())
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    private void validateRange(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null) return;
        if (endAt != null && endAt.isBefore(startAt)) {
            throw new CustomException(ErrorCode.SCHEDULE_INVALID_RANGE);
        }
    }
}
