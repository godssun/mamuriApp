package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.dto.DeleteAccountRequest;
import com.github.mamuriapp.user.entity.AccountDeletionLog;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.AccountDeletionLogRepository;
import com.github.mamuriapp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 계정 관리 서비스.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final AccountDeletionLogRepository accountDeletionLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionService subscriptionService;

    /**
     * 계정을 삭제한다.
     *
     * @param userId  사용자 ID
     * @param request 삭제 요청 (비밀번호, 사유)
     */
    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
        }

        // 삭제 로그 저장 (유저 삭제 전에)
        AccountDeletionLog deletionLog = AccountDeletionLog.builder()
                .userEmail(user.getEmail())
                .reason(request.getReason())
                .reasonDetail(request.getReasonDetail())
                .build();
        accountDeletionLogRepository.save(deletionLog);

        // Stripe 구독 취소 (있을 때만, 실패해도 계속 진행)
        if (user.getStripeSubscriptionId() != null) {
            try {
                subscriptionService.cancelSubscription(userId);
            } catch (Exception e) {
                log.warn("[AccountService] Stripe 구독 취소 실패 (userId={}): {}",
                        userId, e.getMessage());
            }
        }

        // 유저 삭제 → CASCADE로 관련 데이터 자동 삭제
        userRepository.delete(user);
        log.info("[AccountService] 계정 삭제 완료: email={}", user.getEmail());
    }
}
