# Mamuri AI Companion 개인화 시스템 백엔드 아키텍처 리뷰

**작성일**: 2026-03-01
**리뷰 대상**: AI 컴패니언 개인화 기능 추가
**리뷰어 역할**: 백엔드 아키텍처 & 보안 리뷰어

---

## 목차

1. [현재 시스템 분석](#1-현재-시스템-분석)
2. [DB 스키마 설계 결정](#2-db-스키마-설계-결정)
3. [API 설계](#3-api-설계)
4. [보안 & 인증](#4-보안--인증)
5. [핵심 위험요소 (Ranked)](#5-핵심-위험요소-ranked)
6. [수익화 & 확장성 영향](#6-수익화--확장성-영향)
7. [권장사항 (변경 예시 포함)](#7-권장사항-변경-예시-포함)
8. [Do NOT Do 리스트](#8-do-not-do-리스트)
9. [필요 테스트](#9-필요-테스트)

---

## 1. 현재 시스템 분석

### 1.1 기존 데이터 구조

**User 엔티티** (`users` 테이블):
```java
// 컴패니언 관련 필드
private String aiName = "마음이";
private int maxLevel = 1;
private long diaryCount = 0;

// 구독 필드
private SubscriptionStatus subscriptionStatus = SubscriptionStatus.FREE;
private int quotaUsed = 0;

// 스트릭 필드
private int currentStreak = 0;
private int longestStreak = 0;
private LocalDate lastDiaryDate;
```

**UserSettings 엔티티** (`user_settings` 테이블):
```java
@OneToOne(fetch = FetchType.LAZY)
private User user;
private String aiTone = "warm";  // warm/calm/cheerful
private boolean aiEnabled = true;
```

**PromptBuilder**:
- 템플릿 변수: `{{aiName}}`, `{{toneInstruction}}`, `{{level}}`, `{{levelDescription}}`
- TONE_MAP: 3가지 톤 → 한국어 지시문 매핑
- LEVEL_DESCRIPTIONS: Lv.1~10 한국어 설명

### 1.2 현재 아키텍처 강점

✅ **명확한 책임 분리**: User(identity), UserSettings(preferences)
✅ **Lazy Loading**: UserSettings 1:1 매핑으로 불필요 조회 방지
✅ **Versioning**: User 엔티티에 `@Version` (낙관적 락)
✅ **프롬프트 빌더 격리**: AI 로직과 비즈니스 로직 분리
✅ **Feature Flag 준비**: `aiEnabled` 플래그로 AI 비활성화 가능

### 1.3 설계 부채

⚠️ **혼재된 설정 위치**: aiName은 User, aiTone은 UserSettings → 일관성 부족
⚠️ **프롬프트 버전 관리 부재**: PromptBuilder에 버전 정보 없음
⚠️ **톤 유효성 검사 부재**: `aiTone` 컬럼에 DB 제약 조건 없음
⚠️ **캐싱 전략 부재**: 매 AI 요청마다 UserSettings 조회

---

## 2. DB 스키마 설계 결정

### 2.1 옵션 비교

| 항목 | Option A: users 확장 | **Option B: user_settings 확장** | Option C: ai_companions 신규 |
|------|---------------------|--------------------------------|-----------------------------|
| **쿼리 단순성** | ⭐⭐⭐ (조인 불필요) | ⭐⭐ (1회 LEFT JOIN) | ⭐ (매번 조인 필수) |
| **확장성** | ❌ (User 테이블 비대화) | ⭐⭐ (설정 격리 유지) | ⭐⭐⭐ (완전 격리) |
| **성장 시스템 통합** | ❌ (maxLevel 충돌) | ⭐⭐⭐ (자연스러운 확장) | ⭐⭐ (별도 관리) |
| **프롬프트 생성** | ⭐⭐ (단일 엔티티) | ⭐⭐⭐ (기존 패턴 유지) | ⭐ (3개 조회 필요) |
| **마이그레이션 비용** | 낮음 | **최소** | 높음 (외래키 재구성) |
| **권한 관리** | ❌ (User 엔티티 노출) | ⭐⭐⭐ (설정만 노출) | ⭐⭐ (추가 권한 레이어) |

### 2.2 권장: Option B (UserSettings 확장) ⭐

**근거**:
1. **기존 패턴 일관성**: AI 관련 설정은 이미 UserSettings에 존재 (aiTone, aiEnabled)
2. **프롬프트 빌더 통합**: PromptBuilder가 이미 UserSettings 조회 → 0 추가 쿼리
3. **성장 시스템 호환**: 향후 AI 성장 시스템 필드 추가 시 자연스러운 확장
4. **보안 격리**: User 엔티티(인증) vs UserSettings(선호도) 명확 분리

### 2.3 DB 마이그레이션 (V7)

```sql
-- V7__add_companion_personalization.sql

-- 1. 컬럼 추가
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_avatar VARCHAR(10) DEFAULT '🐱',
ADD COLUMN IF NOT EXISTS ai_speech_style VARCHAR(20) DEFAULT 'formal',
ADD COLUMN IF NOT EXISTS ai_personality_tone VARCHAR(20) DEFAULT 'warm';

-- 2. 제약 조건 (데이터 무결성)
ALTER TABLE user_settings
ADD CONSTRAINT check_avatar
  CHECK (ai_avatar IN ('🐱', '🌸', '🌙', '☀️', '🌟', '🍀', '🦋', '🐰')),
ADD CONSTRAINT check_speech_style
  CHECK (ai_speech_style IN ('formal', 'casual')),
ADD CONSTRAINT check_personality_tone
  CHECK (ai_personality_tone IN ('warm', 'calm', 'cheerful', 'realistic'));

-- 3. 인덱스 (성능 최적화)
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- 4. 기존 데이터 마이그레이션 (선택)
UPDATE user_settings
SET ai_personality_tone = ai_tone
WHERE ai_tone IN ('warm', 'calm', 'cheerful');

-- 5. 코멘트 (문서화)
COMMENT ON COLUMN user_settings.ai_avatar IS 'AI 아바타 이모지';
COMMENT ON COLUMN user_settings.ai_speech_style IS '말투 스타일: formal(존댓말), casual(반말)';
COMMENT ON COLUMN user_settings.ai_personality_tone IS 'AI 성격: warm, calm, cheerful, realistic';
```

### 2.4 UserSettings 엔티티 변경

```java
@Entity
@Table(name = "user_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // 기존 필드
    @Column(name = "ai_tone", nullable = false)
    private String aiTone = "warm";  // DEPRECATED: ai_personality_tone으로 마이그레이션 권장

    @Column(name = "ai_enabled", nullable = false)
    private boolean aiEnabled = true;

    // 신규 필드
    @Column(name = "ai_avatar", length = 10, nullable = false)
    private String aiAvatar = "🐱";

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_speech_style", length = 20, nullable = false)
    private SpeechStyle aiSpeechStyle = SpeechStyle.FORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_personality_tone", length = 20, nullable = false)
    private PersonalityTone aiPersonalityTone = PersonalityTone.WARM;

    // 업데이트 메서드
    public void updateCompanionSettings(
            String aiAvatar,
            SpeechStyle speechStyle,
            PersonalityTone personalityTone) {
        this.aiAvatar = aiAvatar;
        this.aiSpeechStyle = speechStyle;
        this.aiPersonalityTone = personalityTone;
    }
}
```

**Enum 정의** (`com.github.mamuriapp.user.entity`):

```java
public enum SpeechStyle {
    FORMAL("존댓말"),
    CASUAL("반말");

    private final String description;

    SpeechStyle(String description) {
        this.description = description;
    }
}

public enum PersonalityTone {
    WARM("따뜻한"),
    CALM("차분한"),
    CHEERFUL("활발한"),
    REALISTIC("현실적인");

    private final String description;

    PersonalityTone(String description) {
        this.description = description;
    }
}
```

### 2.5 데이터 무결성 전략

**DB 레벨**:
- CHECK 제약 조건으로 허용 값 강제
- NOT NULL 제약으로 필수 필드 보장
- UNIQUE 제약 (user_id)로 1:1 보장

**Application 레벨**:
- Enum으로 타입 안전성 확보
- Jakarta Validation으로 요청 검증
- 기본값으로 데이터 일관성 보장

**마이그레이션 안전성**:
- `ADD COLUMN IF NOT EXISTS`로 재실행 안전
- 기본값 지정으로 기존 레코드 자동 마이그레이션
- 코멘트로 스키마 문서화

---

## 3. API 설계

### 3.1 기존 API 확장

**현재**:
```
GET  /api/companion       → {aiName, level, levelDescription, ...}
PUT  /api/companion       → {aiName}
GET  /api/companion/streak → {currentStreak, longestStreak, ...}
```

**확장 제안**:
```
PUT  /api/companion/settings  → {avatar, speechStyle, personalityTone}
GET  /api/companion/settings  → {avatar, speechStyle, personalityTone, aiEnabled}
```

### 3.2 온보딩 API 필요성 분석

**시나리오 1: 신규 가입 시 설정**

| 방법 | 장점 | 단점 |
|------|-----|-----|
| **온보딩 API** | 트랜잭션 안전, 일괄 설정 | 추가 엔드포인트 |
| 기존 API 재사용 | 구현 최소화 | 3회 API 호출 |

**결론**: **온보딩 API 불필요** ❌

**근거**:
1. UserSettings는 회원가입 시 자동 생성 (기본값으로 초기화)
2. 사용자가 나중에 설정 화면에서 변경 가능
3. MVP 단계에서 온보딩 복잡도 최소화 원칙

### 3.3 최종 API 설계

#### 3.3.1 컴패니언 설정 조회

```http
GET /api/companion/settings
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "success": true,
  "data": {
    "avatar": "🐱",
    "speechStyle": "FORMAL",
    "personalityTone": "WARM",
    "aiEnabled": true
  }
}
```

#### 3.3.2 컴패니언 설정 업데이트

```http
PUT /api/companion/settings
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "avatar": "🌸",
  "speechStyle": "CASUAL",
  "personalityTone": "CHEERFUL"
}
```

**요청 유효성**:
```java
@Data
public class CompanionSettingsUpdateRequest {
    @NotNull
    @Pattern(regexp = "^[🐱🌸🌙☀️🌟🍀🦋🐰]$",
             message = "허용되지 않는 아바타입니다")
    private String avatar;

    @NotNull
    @EnumValue(enumClass = SpeechStyle.class,
               message = "FORMAL 또는 CASUAL만 가능합니다")
    private String speechStyle;

    @NotNull
    @EnumValue(enumClass = PersonalityTone.class,
               message = "허용되지 않는 성격 톤입니다")
    private String personalityTone;
}
```

**응답** (200):
```json
{
  "success": true,
  "data": {
    "avatar": "🌸",
    "speechStyle": "CASUAL",
    "personalityTone": "CHEERFUL",
    "aiEnabled": true
  },
  "message": "설정이 업데이트되었습니다"
}
```

#### 3.3.3 AI 활성화 토글 (기존 유지)

```http
PUT /api/companion/settings/ai-enabled
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "aiEnabled": false
}
```

### 3.4 서비스 레이어 설계

**CompanionService**:
```java
@Service
@RequiredArgsConstructor
public class CompanionService {

    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CompanionSettingsResponse getSettings(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        return CompanionSettingsResponse.from(settings);
    }

    @Transactional
    public CompanionSettingsResponse updateSettings(
            Long userId,
            CompanionSettingsUpdateRequest request) {

        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("설정을 찾을 수 없습니다"));

        settings.updateCompanionSettings(
                request.getAvatar(),
                SpeechStyle.valueOf(request.getSpeechStyle()),
                PersonalityTone.valueOf(request.getPersonalityTone())
        );

        UserSettings updated = userSettingsRepository.save(settings);
        return CompanionSettingsResponse.from(updated);
    }

    private UserSettings createDefaultSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        UserSettings settings = UserSettings.builder()
                .user(user)
                .build();

        return userSettingsRepository.save(settings);
    }
}
```

### 3.5 에러 코드 확장

| 상태 코드 | 에러 메시지 | 설명 |
|----------|------------|-----|
| 400 | "허용되지 않는 아바타입니다" | 유효하지 않은 이모지 |
| 400 | "FORMAL 또는 CASUAL만 가능합니다" | 유효하지 않은 말투 |
| 400 | "허용되지 않는 성격 톤입니다" | 유효하지 않은 성격 |
| 404 | "설정을 찾을 수 없습니다" | UserSettings 없음 |

---

## 4. 보안 & 인증

### 4.1 인증 플로우 검증

**현재 JWT 인증**:
```java
@GetMapping("/api/companion/settings")
public ResponseEntity<ApiResponse<CompanionSettingsResponse>> getSettings(
        Authentication authentication) {
    Long userId = (Long) authentication.getPrincipal();
    // ...
}
```

✅ **검증 완료**:
- Spring Security Filter Chain에서 JWT 검증
- `authentication.getPrincipal()` → userId 추출
- 토큰 만료 시 401 자동 반환

### 4.2 권한 검증

**현재 권한 구조**:
- 사용자는 자신의 설정만 조회/변경 가능
- JWT의 userId로 자동 격리
- 별도 관리자 권한 불필요 (MVP)

**보안 취약점 검토**: ❌ 없음

**근거**:
- URL에 userId 노출 없음 (Path Variable 없음)
- JWT Subject가 userId → 조작 불가
- UserSettings의 user_id 외래키로 소유권 보장

### 4.3 입력 유효성 검사

#### 4.3.1 레이어별 검증 전략

| 레이어 | 검증 내용 | 도구 |
|--------|---------|-----|
| **DB** | CHECK 제약, NOT NULL | PostgreSQL |
| **Controller** | 형식 검증, Enum 검증 | Jakarta Validation |
| **Service** | 비즈니스 로직 검증 | 커스텀 로직 |

#### 4.3.2 Jakarta Validation 규칙

```java
public class CompanionSettingsUpdateRequest {

    @NotNull(message = "아바타는 필수입니다")
    @Pattern(regexp = "^[🐱🌸🌙☀️🌟🍀🦋🐰]$",
             message = "허용되지 않는 아바타입니다")
    private String avatar;

    @NotNull(message = "말투 스타일은 필수입니다")
    @EnumValue(enumClass = SpeechStyle.class,
               message = "FORMAL 또는 CASUAL만 가능합니다")
    private String speechStyle;

    @NotNull(message = "성격 톤은 필수입니다")
    @EnumValue(enumClass = PersonalityTone.class,
               message = "WARM, CALM, CHEERFUL, REALISTIC 중 선택해주세요")
    private String personalityTone;
}
```

**커스텀 Validator** (`@EnumValue`):
```java
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = EnumValueValidator.class)
public @interface EnumValue {
    String message() default "허용되지 않는 값입니다";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    Class<? extends Enum<?>> enumClass();
}

public class EnumValueValidator implements ConstraintValidator<EnumValue, String> {
    private List<String> acceptedValues;

    @Override
    public void initialize(EnumValue annotation) {
        acceptedValues = Stream.of(annotation.enumClass().getEnumConstants())
                .map(Enum::name)
                .toList();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || acceptedValues.contains(value);
    }
}
```

#### 4.3.3 XSS 방지

**이모지 화이트리스트**:
```java
private static final Set<String> ALLOWED_AVATARS = Set.of(
    "🐱", "🌸", "🌙", "☀️", "🌟", "🍀", "🦋", "🐰"
);

public void validateAvatar(String avatar) {
    if (!ALLOWED_AVATARS.contains(avatar)) {
        throw new IllegalArgumentException("허용되지 않는 아바타입니다");
    }
}
```

**정규식 검증** (Controller 레벨):
```java
@Pattern(regexp = "^[🐱🌸🌙☀️🌟🍀🦋🐰]$")
```

#### 4.3.4 SQL Injection 방지

✅ **JPA 사용으로 자동 방지**:
- Prepared Statement 자동 사용
- 파라미터 바인딩으로 SQL 문자열 조작 불가

**네이티브 쿼리 사용 시 주의**:
```java
// ❌ 취약한 코드
@Query(value = "SELECT * FROM user_settings WHERE ai_avatar = " + avatar,
       nativeQuery = true)

// ✅ 안전한 코드
@Query(value = "SELECT * FROM user_settings WHERE ai_avatar = :avatar",
       nativeQuery = true)
List<UserSettings> findByAvatar(@Param("avatar") String avatar);
```

### 4.4 Rate Limiting (선택 사항)

**시나리오**: 설정 변경 남용 방지

**구현** (Spring Boot + Bucket4j):
```java
@RateLimiter(name = "companion-settings", fallbackMethod = "rateLimitFallback")
@PutMapping("/api/companion/settings")
public ResponseEntity<ApiResponse<CompanionSettingsResponse>> updateSettings(...) {
    // ...
}

// application.yml
resilience4j.ratelimiter:
  instances:
    companion-settings:
      limit-for-period: 10      # 10회
      limit-refresh-period: 1m  # 1분당
      timeout-duration: 0s
```

**우선순위**: **Post-MVP** (현재 불필요)

---

## 5. 핵심 위험요소 (Ranked)

### 🚨 RISK #1: PromptBuilder 프롬프트 폭발 (Complexity Risk)

**문제**:
```
현재 톤 3가지 × 신규 말투 2가지 × 신규 성격 4가지 = 24가지 조합
각 조합마다 일관된 프롬프트 생성 필요
```

**영향**:
- 프롬프트 유지보수 복잡도 8배 증가
- AI 응답 품질 일관성 저하 위험
- 테스트 케이스 24개 필요

**해결책**:

**Option A: 템플릿 기반 조립** (권장 ⭐):
```java
public class PromptBuilder {

    private static final Map<PersonalityTone, String> PERSONALITY_INSTRUCTIONS = Map.of(
        PersonalityTone.WARM, "따뜻하고 공감하며 위로하는",
        PersonalityTone.CALM, "차분하고 안정적이며 담담한",
        PersonalityTone.CHEERFUL, "밝고 긍정적이며 활기찬",
        PersonalityTone.REALISTIC, "현실적이고 객관적이며 실용적인"
    );

    private static final Map<SpeechStyle, String> SPEECH_INSTRUCTIONS = Map.of(
        SpeechStyle.FORMAL, "존댓말을 사용하여",
        SpeechStyle.CASUAL, "친근한 반말을 사용하여"
    );

    public String buildSystemPrompt(UserSettings settings) {
        String personality = PERSONALITY_INSTRUCTIONS.get(settings.getAiPersonalityTone());
        String speech = SPEECH_INSTRUCTIONS.get(settings.getAiSpeechStyle());

        return String.format(
            "%s %s 말투로 응답해 줘. 2-5문장으로 작성하되, 감정 반영, 공감, 부드러운 격려 순서로 구성해.",
            personality, speech
        );
    }
}
```

**Option B: LLM 프롬프트 자체 조립** (차선책):
```java
// 시스템 프롬프트에서 동적으로 조합 지시
String systemPrompt = """
    당신은 AI 일기 친구입니다.
    사용자 설정:
    - 성격: %s
    - 말투: %s

    위 설정에 맞춰 자연스럽게 응답하세요.
    """.formatted(settings.getAiPersonalityTone(), settings.getAiSpeechStyle());
```

**권장**: **Option A** (명시적 제어 > LLM 자율성)

**완화 전략**:
1. 프롬프트 버전 관리 (ai_comments.prompt_version)
2. A/B 테스트로 품질 검증
3. Feature Flag로 단계적 출시

---

### ⚠️ RISK #2: AI 성장 시스템 Feature Flag 미준비 (Monetization Risk)

**문제**:
- 요구사항: "AI 성장 시스템은 feature flag로 비활성화"
- 현재 코드: User.maxLevel은 항상 활성화됨

**영향**:
- Free 사용자에게 프리미엄 기능 노출 가능
- 수익화 전략 제어 불가
- A/B 테스트 불가능

**해결책**:

**1단계: Feature Flag 인프라 (Spring Boot Togglz)**:

```groovy
// build.gradle.kts
implementation("org.togglz:togglz-spring-boot-starter:3.3.0")
implementation("org.togglz:togglz-spring-security:3.3.0")
```

**Feature 정의**:
```java
public enum MamuriFeature implements Feature {

    @Label("AI 성장 시스템")
    @EnabledByDefault
    AI_GROWTH_SYSTEM,

    @Label("AI 후속 질문")
    @EnabledByDefault
    AI_FOLLOWUP_QUESTIONS,

    @Label("캘린더 스트릭")
    @EnabledByDefault
    CALENDAR_STREAK;

    public boolean isActive() {
        return FeatureContext.getFeatureManager().isActive(this);
    }
}
```

**2단계: 서비스 레이어 적용**:
```java
@Service
public class CompanionService {

    public CompanionResponse getProfile(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        CompanionResponse response = CompanionResponse.builder()
                .aiName(user.getAiName())
                .build();

        // Feature Flag 체크
        if (MamuriFeature.AI_GROWTH_SYSTEM.isActive()) {
            response.setLevel(user.getMaxLevel());
            response.setLevelDescription(getLevelDescription(user.getMaxLevel()));
        } else {
            response.setLevel(null);  // 비활성화 시 null
            response.setLevelDescription(null);
        }

        return response;
    }
}
```

**3단계: Plan-based Access Control**:
```java
public boolean canAccessGrowthSystem(User user) {
    return MamuriFeature.AI_GROWTH_SYSTEM.isActive()
           && user.isPremium();
}
```

**완화 전략**:
- 기본값: 전체 활성화 (MVP 기간)
- 런타임 토글 지원 (재배포 없이 변경)
- 환경별 설정 (dev: 활성화, prod: 선택적)

---

### ⚠️ RISK #3: N+1 쿼리 문제 (Performance Risk)

**문제**:
```java
// 현재 PromptBuilder.build()
UserSettings settings = userSettingsRepository.findByUserId(user.getId());
// → User 조회 (1) + UserSettings 조회 (N)
```

**발생 시나리오**:
- 일기 목록 조회 시 각 일기의 AI 코멘트 재생성 (N회 UserSettings 조회)
- 비용: 일기 10개 → 11개 쿼리

**영향**:
- DB 부하 증가
- API 응답 지연 (+100ms per 10 diaries)

**해결책**:

**Option A: Fetch Join** (권장 ⭐):
```java
@Query("SELECT u FROM User u LEFT JOIN FETCH u.settings WHERE u.id = :userId")
Optional<User> findByIdWithSettings(@Param("userId") Long userId);
```

**Option B: EntityGraph**:
```java
@EntityGraph(attributePaths = {"settings"})
Optional<User> findById(Long userId);
```

**Option C: 캐싱** (추가 최적화):
```java
@Cacheable(value = "userSettings", key = "#userId")
public UserSettings getSettings(Long userId) {
    return userSettingsRepository.findByUserId(userId)
            .orElseGet(() -> createDefaultSettings(userId));
}
```

**권장 조합**: **Option A (Fetch Join) + Option C (캐싱)**

**캐싱 전략**:
```yaml
# application.yml
spring.cache:
  type: caffeine
  cache-names: userSettings
  caffeine.spec: maximumSize=1000,expireAfterWrite=1h
```

---

### ℹ️ RISK #4: 타임존 처리 부재 (Data Integrity Risk)

**문제**:
- 현재: LocalDate 사용 (타임존 독립)
- 위험: 클라이언트 타임존 불일치 시 스트릭 오류

**예시**:
```
사용자 위치: 미국 (UTC-8)
서버 위치: 한국 (UTC+9)

사용자가 12월 31일 23시에 일기 작성
→ 서버에서는 1월 1일로 저장
→ 스트릭 계산 오류
```

**영향**:
- 스트릭 부정확성
- 사용자 불만 증가
- 데이터 신뢰도 하락

**해결책**:

**현재 방식 유지 (권장)**: ✅
- 클라이언트가 LocalDate (YYYY-MM-DD) 전송
- 서버는 타임존 변환 없이 저장
- 사용자가 선택한 날짜를 그대로 사용

**이유**:
1. 일기 작성은 사용자 의도 기반 (실제 시간 무관)
2. 타임존 변환 시 오히려 혼란 발생
3. MVP 단계에서 단순성 우선

**문서화 필요**:
```java
/**
 * 일기 저장
 *
 * @param diaryDate 사용자가 선택한 날짜 (타임존 독립적, LocalDate 형식)
 *                  예: "2026-03-01"
 *                  서버는 이 값을 그대로 저장하며, 타임존 변환을 수행하지 않음
 */
@PostMapping("/api/diaries")
public ResponseEntity<ApiResponse<DiaryResponse>> createDiary(
        @RequestBody DiaryCreateRequest request) {
    // ...
}
```

---

### ℹ️ RISK #5: 프롬프트 버전 관리 부재 (Observability Risk)

**문제**:
- 현재: ai_comments.prompt_version 존재하지만 업데이트 로직 없음
- 영향: 프롬프트 변경 시 A/B 테스트 및 롤백 불가

**해결책**:

**1단계: 버전 상수 관리**:
```java
public class PromptBuilder {

    public static final String CURRENT_VERSION = "v4.0"; // 개인화 추가

    // v3.0: 후속 질문 추가
    // v2.0: 레벨 시스템 추가
    // v1.0: 초기 버전

    public String build(String template, User user, Diary diary) {
        // ...
        // 버전은 AICommentService에서 설정
    }
}
```

**2단계: AI 코멘트 저장 시 버전 기록**:
```java
@Service
public class AICommentService {

    public AiComment generateComment(Diary diary, User user) {
        String prompt = promptBuilder.build(template, user, diary);
        String aiResponse = llmClient.call(prompt);

        return AiComment.builder()
                .diary(diary)
                .content(aiResponse)
                .modelName("gpt-4")
                .promptVersion(PromptBuilder.CURRENT_VERSION)  // 버전 기록
                .build();
    }
}
```

**3단계: 모니터링 쿼리**:
```sql
-- 버전별 분포 확인
SELECT prompt_version, COUNT(*)
FROM ai_comments
GROUP BY prompt_version
ORDER BY created_at DESC;

-- 특정 버전 품질 분석 (사용자 피드백과 조인)
SELECT prompt_version, AVG(user_rating)
FROM ai_comments
LEFT JOIN user_feedback ON ai_comments.id = user_feedback.comment_id
GROUP BY prompt_version;
```

**우선순위**: **P1** (개인화 기능과 함께 배포)

---

## 6. 수익화 & 확장성 영향

### 6.1 프리미엄 전환 경로

**현재 상태**:
```
Free: AI 코멘트 월 30회 제한
Premium: 무제한 AI 코멘트 + 고급 기능
```

**개인화 추가 시 시나리오**:

| 기능 | Free | Premium | 전환 동기 |
|------|------|---------|---------  |
| 기본 아바타 (🐱) | ✅ | ✅ | - |
| 추가 아바타 (🌸🌙☀️...) | ❌ | ✅ | ⭐⭐ (중간) |
| 말투 변경 | ❌ | ✅ | ⭐⭐⭐ (높음) |
| 성격 톤 확장 | ❌ | ✅ | ⭐⭐⭐ (높음) |
| AI 성장 시스템 | ❌ | ✅ | ⭐⭐⭐⭐ (매우 높음) |

**권장 Freemium 전략**:

**Option A: 완전 잠금** (권장 ⭐):
```java
public CompanionSettingsResponse updateSettings(Long userId, Request request) {
    User user = userRepository.findById(userId).orElseThrow();

    // Premium 전용 기능 체크
    if (!user.isPremium()) {
        if (!request.getAvatar().equals("🐱")) {
            throw new PremiumRequiredException("추가 아바타는 프리미엄 전용입니다");
        }
        if (request.getSpeechStyle() != SpeechStyle.FORMAL) {
            throw new PremiumRequiredException("말투 변경은 프리미엄 전용입니다");
        }
        if (request.getPersonalityTone() != PersonalityTone.WARM) {
            throw new PremiumRequiredException("성격 톤 변경은 프리미엄 전용입니다");
        }
    }

    // 설정 업데이트
    // ...
}
```

**Option B: 부분 개방** (전환율 최적화):
```
Free: 아바타 3개 + 말투 formal + 성격 warm
Premium: 아바타 8개 + 말투 2가지 + 성격 4가지
```

**전환율 예측** (가정):
- 개인화 미제공: 기준 전환율 2%
- 부분 개방 (Option B): +0.5%p → 2.5%
- 완전 잠금 (Option A): +1.2%p → 3.2%

**권장**: **Option A** (명확한 가치 전달)

### 6.2 쿼터 시스템 통합

**현재 쿼터 로직**:
```java
public boolean canUseAI(User user) {
    if (user.isPremium()) return true;
    return user.getQuotaUsed() < 30;
}
```

**개인화 설정 변경 시 쿼터 소비 여부**:

| 액션 | 쿼터 소비 | 근거 |
|------|---------|-----|
| 설정 조회 | ❌ | 읽기 작업 |
| 설정 변경 | ❌ | AI 호출 없음 |
| AI 코멘트 생성 | ✅ | 실제 LLM 호출 |

✅ **결론**: 설정 변경은 쿼터 소비 안 함

### 6.3 비용 영향 분석

**AI 토큰 비용 변화**:

| 항목 | Before | After | 증가율 |
|------|--------|-------|-------|
| 시스템 프롬프트 | 120 토큰 | 150 토큰 | +25% |
| 사용자 메시지 | 200 토큰 | 200 토큰 | 0% |
| AI 응답 | 100 토큰 | 100 토큰 | 0% |
| **총합** | **420 토큰** | **450 토큰** | **+7%** |

**월간 비용 시뮬레이션** (GPT-4 기준: $0.03/1K input):
```
1만 사용자 × 5일기/월 × 450토큰 = 2,250만 토큰/월
비용: $675/월 (Before: $630/월)
증가분: $45/월
```

**ROI 분석**:
```
프리미엄 전환율 +1.2%p × 1만 사용자 = 120명
구독료 ₩9,900/월 × 120명 = ₩1,188,000/월
추가 AI 비용: ₩60,000/월 (환율 1,330원)

순수익 증가: ₩1,128,000/월
ROI: 1,880%
```

✅ **결론**: 비용 대비 수익 효과 매우 높음

### 6.4 확장성 제약 사항

**현재 아키텍처 제약**:

| 항목 | 제약 | 스케일 임계값 | 해결책 |
|------|-----|-------------|-------|
| 동기 AI 호출 | 응답 지연 | 동시 요청 100+ | 비동기 큐 |
| UserSettings 조회 | N+1 쿼리 | 일기 목록 조회 | 캐싱, Fetch Join |
| 프롬프트 조립 | CPU 부하 | TPS 500+ | 템플릿 캐싱 |

**확장 로드맵**:

**Phase 1 (현재 MVP)**: 동기 처리
**Phase 2 (1만 MAU)**: Redis 캐싱
**Phase 3 (10만 MAU)**: 비동기 큐 (RabbitMQ)
**Phase 4 (100만 MAU)**: 마이크로서비스 분리

---

## 7. 권장사항 (변경 예시 포함)

### 7.1 DB 스키마

**권장**: UserSettings 테이블 확장 (Option B)

**마이그레이션 스크립트**:
```sql
-- V7__add_companion_personalization.sql
ALTER TABLE user_settings
ADD COLUMN ai_avatar VARCHAR(10) DEFAULT '🐱',
ADD COLUMN ai_speech_style VARCHAR(20) DEFAULT 'FORMAL',
ADD COLUMN ai_personality_tone VARCHAR(20) DEFAULT 'WARM',
ADD CONSTRAINT check_avatar CHECK (ai_avatar IN ('🐱', '🌸', '🌙', '☀️', '🌟', '🍀', '🦋', '🐰')),
ADD CONSTRAINT check_speech_style CHECK (ai_speech_style IN ('FORMAL', 'CASUAL')),
ADD CONSTRAINT check_personality_tone CHECK (ai_personality_tone IN ('WARM', 'CALM', 'CHEERFUL', 'REALISTIC'));
```

### 7.2 API 엔드포인트

**권장**: 별도 설정 API 추가

```
PUT /api/companion/settings
GET /api/companion/settings
```

**기존 API 변경 불필요** (후방 호환성 유지)

### 7.3 프롬프트 관리

**권장**: 템플릿 기반 조립 (RISK #1 해결책)

**구현 예시**:
```java
public String buildSystemPrompt(UserSettings settings) {
    String base = """
        당신은 '%s'이라는 이름의 AI 일기 친구입니다.
        사용자의 일기를 읽고 공감과 위로를 전달하세요.
        """;

    String personality = PERSONALITY_MAP.get(settings.getAiPersonalityTone());
    String speech = SPEECH_MAP.get(settings.getAiSpeechStyle());
    String tone = TONE_MAP.get(settings.getAiTone());  // 기존 필드 유지

    return base.formatted(aiName) + "\n" +
           "말투: " + personality + " + " + speech + "\n" +
           "응답 길이: 2-5문장";
}
```

### 7.4 Feature Flag 설정

**권장**: Togglz 도입 (RISK #2 해결책)

**설정 예시**:
```yaml
# application-dev.yml
togglz:
  enabled: true
  features:
    AI_GROWTH_SYSTEM:
      enabled: true
    AI_FOLLOWUP_QUESTIONS:
      enabled: true
    COMPANION_PERSONALIZATION:
      enabled: true

# application-prod.yml
togglz:
  enabled: true
  features:
    AI_GROWTH_SYSTEM:
      enabled: false  # 프리미엄 출시 후 활성화
    COMPANION_PERSONALIZATION:
      enabled: true
      strategy: gradual
      parameters:
        percentage: 20  # 20% 사용자에게만 공개
```

### 7.5 캐싱 전략

**권장**: UserSettings 캐싱 (RISK #3 해결책)

**구현**:
```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("userSettings");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats());
        return cacheManager;
    }
}

@Service
public class CompanionService {

    @Cacheable(value = "userSettings", key = "#userId")
    public UserSettings getSettings(Long userId) {
        return userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));
    }

    @CacheEvict(value = "userSettings", key = "#userId")
    public void updateSettings(Long userId, CompanionSettingsUpdateRequest request) {
        // 설정 업데이트
        // 캐시 자동 삭제
    }
}
```

### 7.6 보안 체크리스트

**필수 구현**:
- [x] Jakarta Validation으로 입력 검증
- [x] DB CHECK 제약 조건으로 데이터 무결성 보장
- [x] JWT 인증으로 사용자 격리
- [ ] Rate Limiting (Post-MVP)
- [ ] CSRF 토큰 (웹 버전 출시 시)

### 7.7 모니터링 지표

**필수 메트릭**:
```java
@Component
public class CompanionMetrics {

    private final MeterRegistry registry;

    public void recordSettingsUpdate(String field) {
        registry.counter("companion.settings.update", "field", field).increment();
    }

    public void recordPromptGeneration(String version, long duration) {
        registry.timer("companion.prompt.generation",
                       "version", version)
                .record(duration, TimeUnit.MILLISECONDS);
    }
}
```

**대시보드 항목**:
- 설정 변경 빈도 (아바타/말투/성격별)
- 프롬프트 생성 시간 (P50, P95, P99)
- 캐시 히트율 (UserSettings)
- 프리미엄 전환율 (개인화 기능 사용 후)

---

## 8. Do NOT Do 리스트

### ❌ 1. aiName을 UserSettings로 이동하지 마세요

**이유**:
- aiName은 사용자 identity의 일부 (User 엔티티에 유지)
- User 조회 시 항상 필요 (Lazy Loading 비효율)
- 기존 API 계약 유지 (`GET /api/companion` → aiName 포함)

### ❌ 2. 기존 aiTone 필드를 삭제하지 마세요

**이유**:
- 하위 호환성 파괴
- 기존 사용자 데이터 마이그레이션 리스크
- 점진적 마이그레이션 필요

**권장**:
```java
// Deprecated 마킹 후 유지
@Deprecated
@Column(name = "ai_tone")
private String aiTone;

// 신규 필드 추가
@Column(name = "ai_personality_tone")
private PersonalityTone aiPersonalityTone;
```

### ❌ 3. 온보딩 API를 별도로 만들지 마세요

**이유**:
- 회원가입 시 UserSettings 자동 생성 (기본값)
- 사용자가 나중에 설정 화면에서 변경 가능
- MVP 복잡도 증가 회피

### ❌ 4. 설정 변경을 쿼터로 제한하지 마세요

**이유**:
- 사용자 경험 저해
- 설정 변경은 AI 호출 없음 (비용 무관)
- 남용 방지는 Rate Limiting으로 충분

### ❌ 5. 클라이언트에서 프롬프트를 조립하지 마세요

**이유**:
- 보안 위험 (프롬프트 조작 가능)
- 비즈니스 로직 노출
- 버전 관리 불가

### ❌ 6. 설정 변경 시 기존 AI 코멘트를 재생성하지 마세요

**이유**:
- AI 비용 폭증
- 일기 내용 변경 없이 코멘트만 변경 → 사용자 혼란
- 새 일기부터만 신규 설정 적용

### ❌ 7. 아바타를 DB 이미지로 저장하지 마세요

**이유**:
- 이모지는 UTF-8 문자열 (VARCHAR 충분)
- 이미지 저장 시 스토리지 비용 증가
- 클라이언트 렌더링 복잡도 증가

---

## 9. 필요 테스트

### 9.1 Unit Tests (Service 레이어)

**CompanionService**:
```java
@Test
void 설정_조회_시_존재하지_않으면_기본값_생성() {
    // Given
    Long userId = 1L;
    when(userSettingsRepository.findByUserId(userId))
        .thenReturn(Optional.empty());

    // When
    CompanionSettingsResponse response = companionService.getSettings(userId);

    // Then
    assertThat(response.getAvatar()).isEqualTo("🐱");
    assertThat(response.getSpeechStyle()).isEqualTo(SpeechStyle.FORMAL);
    assertThat(response.getPersonalityTone()).isEqualTo(PersonalityTone.WARM);
    verify(userSettingsRepository).save(any(UserSettings.class));
}

@Test
void 프리미엄_전용_기능_Free_사용자_접근_시_예외() {
    // Given
    User freeUser = User.builder()
        .subscriptionStatus(SubscriptionStatus.FREE)
        .build();
    CompanionSettingsUpdateRequest request = new CompanionSettingsUpdateRequest();
    request.setAvatar("🌸");  // 프리미엄 전용

    // When & Then
    assertThatThrownBy(() -> companionService.updateSettings(freeUser.getId(), request))
        .isInstanceOf(PremiumRequiredException.class)
        .hasMessage("추가 아바타는 프리미엄 전용입니다");
}

@Test
void 캐시_히트_시_DB_조회_안_함() {
    // Given
    Long userId = 1L;
    UserSettings settings = UserSettings.builder().build();
    when(userSettingsRepository.findByUserId(userId))
        .thenReturn(Optional.of(settings));

    // When
    companionService.getSettings(userId);  // 첫 호출 → DB 조회
    companionService.getSettings(userId);  // 두 번째 호출 → 캐시 히트

    // Then
    verify(userSettingsRepository, times(1)).findByUserId(userId);
}
```

**PromptBuilder**:
```java
@Test
void 개인화_설정_반영한_프롬프트_생성() {
    // Given
    UserSettings settings = UserSettings.builder()
        .aiAvatar("🌸")
        .aiSpeechStyle(SpeechStyle.CASUAL)
        .aiPersonalityTone(PersonalityTone.CHEERFUL)
        .build();

    User user = User.builder()
        .aiName("벚꽃이")
        .build();

    // When
    String prompt = promptBuilder.build(template, user, diary);

    // Then
    assertThat(prompt).contains("벚꽃이");
    assertThat(prompt).contains("밝고 긍정적이며");
    assertThat(prompt).contains("친근한 반말");
}

@Test
void 프롬프트_버전_기록() {
    // When
    AiComment comment = aiCommentService.generateComment(diary, user);

    // Then
    assertThat(comment.getPromptVersion()).isEqualTo("v4.0");
}
```

### 9.2 Integration Tests (Controller + Service)

**CompanionController**:
```java
@SpringBootTest
@AutoConfigureMockMvc
class CompanionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    @Test
    @WithMockUser(userId = "1")
    void 설정_업데이트_성공() throws Exception {
        // Given
        String requestBody = """
            {
              "avatar": "🌸",
              "speechStyle": "CASUAL",
              "personalityTone": "CHEERFUL"
            }
            """;

        // When & Then
        mockMvc.perform(put("/api/companion/settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatar").value("🌸"))
                .andExpect(jsonPath("$.data.speechStyle").value("CASUAL"))
                .andExpect(jsonPath("$.data.personalityTone").value("CHEERFUL"));
    }

    @Test
    @WithMockUser(userId = "1")
    void 유효하지_않은_아바타_요청_시_400() throws Exception {
        // Given
        String requestBody = """
            {
              "avatar": "😈",
              "speechStyle": "FORMAL",
              "personalityTone": "WARM"
            }
            """;

        // When & Then
        mockMvc.perform(put("/api/companion/settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("허용되지 않는 아바타입니다"));
    }
}
```

### 9.3 Repository Tests (DB 제약 조건)

```java
@DataJpaTest
class UserSettingsRepositoryTest {

    @Autowired
    private UserSettingsRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void CHECK_제약_조건_위반_시_예외() {
        // Given
        UserSettings settings = UserSettings.builder()
            .aiAvatar("😈")  // 허용되지 않는 값
            .build();

        // When & Then
        assertThatThrownBy(() -> {
            entityManager.persistAndFlush(settings);
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    void 기본값_자동_설정() {
        // Given
        User user = User.builder().email("test@test.com").build();
        entityManager.persist(user);

        UserSettings settings = UserSettings.builder()
            .user(user)
            .build();

        // When
        UserSettings saved = repository.save(settings);

        // Then
        assertThat(saved.getAiAvatar()).isEqualTo("🐱");
        assertThat(saved.getAiSpeechStyle()).isEqualTo(SpeechStyle.FORMAL);
        assertThat(saved.getAiPersonalityTone()).isEqualTo(PersonalityTone.WARM);
    }
}
```

### 9.4 Performance Tests (N+1 방지)

```java
@SpringBootTest
class PerformanceTest {

    @Autowired
    private DiaryRepository diaryRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void N_plus_1_쿼리_방지_검증() {
        // Given
        User user = userRepository.findByIdWithSettings(1L).orElseThrow();
        List<Diary> diaries = diaryRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId());

        // When
        long queryCount = countQueries(() -> {
            for (Diary diary : diaries) {
                promptBuilder.build(template, user, diary);
            }
        });

        // Then
        assertThat(queryCount).isLessThanOrEqualTo(2);  // User + UserSettings 조회만
    }
}
```

### 9.5 End-to-End Tests (QA 필수)

| 시나리오 | 기대 결과 | 우선순위 |
|---------|---------|---------|
| 신규 가입 → 설정 조회 | 기본값 반환 (🐱, FORMAL, WARM) | P0 |
| 프리미엄 → 아바타 변경 | 성공 (200) | P0 |
| Free → 아바타 변경 | 실패 (403, 프리미엄 필요) | P0 |
| 설정 변경 → 새 일기 작성 | 새 설정 반영된 AI 코멘트 | P0 |
| 설정 변경 → 기존 일기 조회 | 기존 코멘트 유지 | P1 |
| 유효하지 않은 Enum | 400 에러 | P1 |
| 캐시 무효화 확인 | 설정 변경 후 즉시 반영 | P1 |

---

## 10. 우선순위 기반 구현 순서

### Phase 1: 핵심 기능 (1-2주)
1. DB 마이그레이션 (V7)
2. UserSettings 엔티티 확장
3. CompanionService 구현
4. API 엔드포인트 추가
5. 입력 유효성 검사

### Phase 2: 안정성 (1주)
6. PromptBuilder 프롬프트 템플릿 조립
7. Feature Flag 인프라 (Togglz)
8. 캐싱 전략 구현
9. 단위 테스트 (Service, PromptBuilder)

### Phase 3: 수익화 (1주)
10. Premium 전용 기능 권한 체크
11. 프리미엄 전환 유도 메시지
12. 모니터링 지표 추가
13. E2E 테스트

### Phase 4: 최적화 (선택)
14. N+1 쿼리 방지 (Fetch Join)
15. Rate Limiting
16. A/B 테스트 인프라

---

## 11. 체크리스트

### 구현 전
- [ ] DB 마이그레이션 스크립트 리뷰
- [ ] Feature Flag 전략 합의
- [ ] 프리미엄 전용 기능 범위 확정
- [ ] 프롬프트 템플릿 설계 리뷰

### 구현 중
- [ ] UserSettings Enum 타입 안전성 확보
- [ ] Jakarta Validation 적용
- [ ] DB CHECK 제약 조건 추가
- [ ] 캐싱 전략 구현
- [ ] 프롬프트 버전 관리 구현

### 배포 전
- [ ] 단위 테스트 커버리지 80%+
- [ ] 통합 테스트 P0 시나리오 통과
- [ ] 성능 테스트 (N+1 방지 검증)
- [ ] 프리미엄 권한 체크 테스트
- [ ] 모니터링 대시보드 설정

### 배포 후
- [ ] 프롬프트 생성 시간 모니터링
- [ ] 캐시 히트율 확인
- [ ] 프리미엄 전환율 추적
- [ ] AI 응답 품질 피드백 수집

---

## 부록 A: 관련 파일 경로

**엔티티**:
- `/src/main/java/com/github/mamuriapp/user/entity/User.java`
- `/src/main/java/com/github/mamuriapp/user/entity/UserSettings.java`

**서비스**:
- `/src/main/java/com/github/mamuriapp/user/service/CompanionService.java`
- `/src/main/java/com/github/mamuriapp/ai/service/PromptBuilder.java`

**컨트롤러**:
- `/src/main/java/com/github/mamuriapp/user/controller/CompanionController.java`

**마이그레이션**:
- `/src/main/resources/db/migration/V7__add_companion_personalization.sql`

**테스트**:
- `/src/test/java/com/github/mamuriapp/user/service/CompanionServiceTest.java`
- `/src/test/java/com/github/mamuriapp/ai/service/PromptBuilderTest.java`

---

## 부록 B: 참고 문서

- [PROJECT.md](.claude/PROJECT.md): MVP 범위, AI 톤 설정
- [ARCHITECTURE.md](.claude/ARCHITECTURE.md): DB 설계, AI 플로우
- [API_CONTRACT.md](docs/API_CONTRACT.md): REST API 스펙
- [retention-system/01-product-spec.md](docs/retention-system/01-product-spec.md): 리텐션 시스템 제품 명세
- [retention-system/03-backend-review.md](docs/retention-system/03-backend-review.md): 스트릭 시스템 백엔드 리뷰

---

**리뷰 완료일**: 2026-03-01
**다음 리뷰 시점**: Phase 1 구현 완료 후
