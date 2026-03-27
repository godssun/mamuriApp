package com.github.mamuriapp.admin.service;

import com.github.mamuriapp.admin.dto.AdminUserDetail;
import com.github.mamuriapp.admin.dto.AdminUserSummary;
import com.github.mamuriapp.user.entity.SubscriptionStatus;
import com.github.mamuriapp.user.entity.SubscriptionTier;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin 사용자 관리 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final UserRepository userRepository;

    /**
     * 사용자 목록을 페이징/검색/필터 조회한다.
     */
    public Page<AdminUserSummary> getUsers(String keyword, String tier, String status,
                                            int page, int size, String sortBy, String sortDir) {
        SubscriptionTier tierEnum = null;
        SubscriptionStatus statusEnum = null;
        if (tier != null && !tier.isBlank()) {
            try { tierEnum = SubscriptionTier.valueOf(tier.toUpperCase()); } catch (Exception ignored) {}
        }
        if (status != null && !status.isBlank()) {
            try { statusEnum = SubscriptionStatus.valueOf(status.toUpperCase()); } catch (Exception ignored) {}
        }

        String searchKeyword = (keyword != null && !keyword.isBlank()) ? keyword : null;

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir != null ? sortDir : "desc"),
                            sortBy != null ? sortBy : "createdAt");
        PageRequest pageable = PageRequest.of(page, size, sort);

        return userRepository.findByFilters(searchKeyword, tierEnum, statusEnum, pageable)
                .map(this::toSummary);
    }

    /**
     * 사용자 상세 정보를 조회한다.
     */
    public AdminUserDetail getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return toDetail(user);
    }

    private AdminUserSummary toSummary(User user) {
        return AdminUserSummary.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .authProvider(user.getAuthProvider().name())
                .subscriptionStatus(user.getSubscriptionStatus().name())
                .subscriptionTier(user.getSubscriptionTier().name())
                .diaryCount(user.getDiaryCount())
                .currentStreak(user.getCurrentStreak())
                .longestStreak(user.getLongestStreak())
                .lastDiaryDate(user.getLastDiaryDate() != null ? user.getLastDiaryDate().toString() : null)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    private AdminUserDetail toDetail(User user) {
        return AdminUserDetail.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .authProvider(user.getAuthProvider().name())
                .profileImageUrl(user.getProfileImageUrl())
                .aiName(user.getAiName())
                .maxLevel(user.getMaxLevel())
                .subscriptionStatus(user.getSubscriptionStatus().name())
                .subscriptionTier(user.getSubscriptionTier().name())
                .currentPeriodEnd(user.getCurrentPeriodEnd() != null ? user.getCurrentPeriodEnd().toString() : null)
                .stripeCustomerId(user.getStripeCustomerId())
                .quotaUsed(user.getQuotaUsed())
                .diaryCount(user.getDiaryCount())
                .currentStreak(user.getCurrentStreak())
                .longestStreak(user.getLongestStreak())
                .lastDiaryDate(user.getLastDiaryDate() != null ? user.getLastDiaryDate().toString() : null)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .updatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : null)
                .build();
    }
}
