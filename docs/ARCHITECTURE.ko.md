# ARCHITECTURE.md

## 상위 아키텍처

[ React Native 앱 ]

        |

        | REST API

        v

[ Spring Boot 백엔드 ]

        |

        | JPA

        v

[ PostgreSQL 데이터베이스 ]

        |

        | AI 요청

        v

[ 외부 LLM API ]

---

## 프론트엔드 (React Native)

- 프레임워크: Expo + TypeScript
- 상태 관리: Zustand 또는 React Context
- 데이터 페칭: TanStack Query
- 화면 구성:
  - 로그인 / 회원가입
  - 일기 목록
  - 일기 작성
  - 일기 상세
  - 설정

---

## 백엔드 (Spring Boot)

- 인증: JWT (Access + Refresh)
- 핵심 서비스:
  - AuthService (인증 서비스)
  - DiaryService (일기 서비스)
  - AICommentService (AI 코멘트 서비스)
  - SafetyCheckService (안전 검사 서비스)
- 에러 처리:
  - AI 실패가 일기 저장을 차단하지 않음
  - 재시도 엔드포인트 제공

---

## 데이터베이스 설계 (MVP)

- users (사용자)
- diaries (일기)
- ai_comments (AI 코멘트)
- user_settings (사용자 설정)
- safety_events (안전 이벤트, 선택적, MVP-lite)

---

## AI 코멘트 흐름

1. 사용자가 일기를 제출
2. 백엔드가 일기를 저장
3. 안전 검사 (경량)
4. 프롬프트 조립 (설정 + 일기)
5. LLM 동기 호출
6. AI 코멘트 저장
7. 클라이언트에 응답 반환

---

## 장애 처리

- AI 타임아웃 또는 에러:
  - aiComment = null로 일기 반환
  - 재시도 허용

- 안전 트리거:
  - 안전 중심 메시지로 응답 대체

---

## 보안 고려사항

- HTTPS 강제 적용
- 민감 필드 저장 시 암호화 (선택적)
- AI 제공자가 일기 데이터를 학습에 사용하지 않음
- 액세스 토큰 안전하게 저장

---

## 확장성 (MVP 이후)

- 큐를 통한 비동기 AI 생성
- 장기 개인화를 위한 메모리 임베딩
- 푸시 알림
- 구독 모델

---

ARCHITECTURE.md 끝
