package com.github.mamuriapp.user.service;

import com.github.mamuriapp.global.exception.CustomException;
import com.github.mamuriapp.global.exception.ErrorCode;
import com.github.mamuriapp.user.dto.DeleteAccountRequest;
import com.github.mamuriapp.user.entity.AccountDeletionLog;
import com.github.mamuriapp.user.entity.User;
import com.github.mamuriapp.user.repository.AccountDeletionLogRepository;
import com.github.mamuriapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * AccountService 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @InjectMocks
    private AccountService accountService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountDeletionLogRepository accountDeletionLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SubscriptionService subscriptionService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("encodedPassword")
                .nickname("테스트")
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);
    }

    @Test
    @DisplayName("계정 삭제 성공 - Stripe 구독 없는 유저")
    void deleteAccount_success_noStripe() {
        // given
        DeleteAccountRequest request = new DeleteAccountRequest(
                "rawPassword", "사용 빈도가 낮아서", null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("rawPassword", "encodedPassword")).thenReturn(true);

        // when
        accountService.deleteAccount(1L, request);

        // then
        ArgumentCaptor<AccountDeletionLog> logCaptor = ArgumentCaptor.forClass(AccountDeletionLog.class);
        verify(accountDeletionLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getUserEmail()).isEqualTo("test@example.com");
        assertThat(logCaptor.getValue().getReason()).isEqualTo("사용 빈도가 낮아서");

        verify(subscriptionService, never()).cancelSubscription(any());
        verify(userRepository).delete(testUser);
    }

    @Test
    @DisplayName("계정 삭제 성공 - Stripe 구독 있는 유저")
    void deleteAccount_success_withStripe() {
        // given
        ReflectionTestUtils.setField(testUser, "stripeSubscriptionId", "sub_123");
        DeleteAccountRequest request = new DeleteAccountRequest(
                "rawPassword", "다른 일기 앱 사용", "노션으로 이동");
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("rawPassword", "encodedPassword")).thenReturn(true);

        // when
        accountService.deleteAccount(1L, request);

        // then
        verify(subscriptionService).cancelSubscription(1L);
        verify(userRepository).delete(testUser);

        ArgumentCaptor<AccountDeletionLog> logCaptor = ArgumentCaptor.forClass(AccountDeletionLog.class);
        verify(accountDeletionLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getReasonDetail()).isEqualTo("노션으로 이동");
    }

    @Test
    @DisplayName("잘못된 비밀번호 - PASSWORD_MISMATCH")
    void deleteAccount_wrongPassword() {
        // given
        DeleteAccountRequest request = new DeleteAccountRequest(
                "wrongPassword", "사용 빈도가 낮아서", null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> accountService.deleteAccount(1L, request))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.PASSWORD_MISMATCH));

        verify(accountDeletionLogRepository, never()).save(any());
        verify(userRepository, never()).delete(any());
    }

    @Test
    @DisplayName("유저 없음 - USER_NOT_FOUND")
    void deleteAccount_userNotFound() {
        // given
        DeleteAccountRequest request = new DeleteAccountRequest(
                "rawPassword", "사용 빈도가 낮아서", null);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> accountService.deleteAccount(999L, request))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.USER_NOT_FOUND));
    }

    @Test
    @DisplayName("Stripe 구독 취소 실패해도 계정 삭제는 진행")
    void deleteAccount_stripeFailure_continuesDeleting() {
        // given
        ReflectionTestUtils.setField(testUser, "stripeSubscriptionId", "sub_456");
        DeleteAccountRequest request = new DeleteAccountRequest(
                "rawPassword", "개인정보 걱정", null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("rawPassword", "encodedPassword")).thenReturn(true);
        doThrow(new RuntimeException("Stripe API error"))
                .when(subscriptionService).cancelSubscription(1L);

        // when
        accountService.deleteAccount(1L, request);

        // then - Stripe 실패해도 삭제는 진행됨
        verify(accountDeletionLogRepository).save(any(AccountDeletionLog.class));
        verify(userRepository).delete(testUser);
    }
}
