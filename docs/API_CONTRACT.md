# Mamuri API Contract

**Base URL**: `http://localhost:8080/api`

**공통 응답 형식**:
```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

**에러 응답**:
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

---

## 1. 인증 (Auth)

### POST /auth/signup
회원가입

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "마무리"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### POST /auth/login
로그인

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### POST /auth/refresh
토큰 갱신

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## 2. 일기 (Diaries)

> 모든 일기 API는 `Authorization: Bearer {accessToken}` 헤더 필요

### POST /diaries
일기 작성 (AI 코멘트 자동 생성)

**Request**:
```json
{
  "title": "오늘의 일기",
  "content": "오늘 하루는 정말 힘들었다...",
  "diaryDate": "2024-02-07"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| title | O | 제목 (최대 100자) |
| content | O | 내용 |
| diaryDate | X | 일기 날짜 (YYYY-MM-DD). 미입력 시 오늘. 미래 날짜 불가. |

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "오늘의 일기",
    "content": "오늘 하루는 정말 힘들었다...",
    "diaryDate": "2024-02-07",
    "aiComment": {
      "id": 1,
      "content": "힘든 하루를 보내셨군요. 그런 감정을 느끼는 건 당연해요...",
      "createdAt": "2024-02-07T10:30:00"
    },
    "createdAt": "2024-02-07T10:30:00",
    "updatedAt": "2024-02-07T10:30:00"
  }
}
```

---

### GET /diaries
일기 목록 조회

**Query Parameters** (선택):
| 파라미터 | 설명 |
|----------|------|
| year | 연도 (month와 함께 사용) |
| month | 월 (1-12, year와 함께 사용) |

- `year`와 `month`를 모두 지정하면 해당 월의 일기만 조회
- 미지정 시 전체 일기 조회 (최신순)

**예시**:
- `GET /diaries` - 전체 일기
- `GET /diaries?year=2024&month=2` - 2024년 2월 일기

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "오늘의 일기",
      "content": "오늘 하루는 정말 힘들었다...",
      "diaryDate": "2024-02-07",
      "aiComment": null,
      "createdAt": "2024-02-07T10:30:00",
      "updatedAt": "2024-02-07T10:30:00"
    }
  ]
}
```

> 목록 조회 시 `aiComment`는 null로 반환됩니다. 상세 조회에서 확인하세요.

---

### GET /diaries/calendar
캘린더용 일기 날짜 목록 조회

**Query Parameters** (필수):
| 파라미터 | 설명 |
|----------|------|
| year | 연도 |
| month | 월 (1-12) |

**예시**: `GET /diaries/calendar?year=2024&month=2`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 2,
    "datesWithDiaries": ["2024-02-01", "2024-02-03", "2024-02-07"]
  }
}
```

---

### GET /diaries/{diaryId}
일기 상세 조회

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "오늘의 일기",
    "content": "오늘 하루는 정말 힘들었다...",
    "diaryDate": "2024-02-07",
    "aiComment": {
      "id": 1,
      "content": "힘든 하루를 보내셨군요...",
      "createdAt": "2024-02-07T10:30:00"
    },
    "createdAt": "2024-02-07T10:30:00",
    "updatedAt": "2024-02-07T10:30:00"
  }
}
```

---

### PUT /diaries/{diaryId}
일기 수정

**Request**:
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "diaryDate": "2024-02-06"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| title | O | 제목 (최대 100자) |
| content | O | 내용 |
| diaryDate | X | 일기 날짜. 미입력 시 기존 유지. 미래 날짜 불가. |

**Response** (200): 일기 상세와 동일

---

### DELETE /diaries/{diaryId}
일기 삭제

**Response** (200):
```json
{
  "success": true,
  "data": null
}
```

---

## 3. AI 코멘트

### POST /diaries/{diaryId}/ai-comment/retry
AI 코멘트 재생성

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "content": "새로 생성된 AI 코멘트...",
    "createdAt": "2024-02-07T11:00:00"
  }
}
```

---

## 4. 설정 (Settings)

### GET /settings
사용자 설정 조회

**Response** (200):
```json
{
  "success": true,
  "data": {
    "aiTone": "warm",
    "aiEnabled": true
  }
}
```

---

### PUT /settings
사용자 설정 변경

**Request**:
```json
{
  "aiTone": "warm",
  "aiEnabled": true
}
```

**Response** (200): 설정 조회와 동일

---

## 에러 코드

| HTTP | message | 설명 |
|------|---------|------|
| 400 | 유효성 검사 실패 메시지 | 입력 값 오류 |
| 401 | 인증이 필요합니다 | 토큰 없음/만료 |
| 403 | 접근 권한이 없습니다 | 타인의 리소스 |
| 404 | 일기를 찾을 수 없습니다 | 리소스 없음 |
| 409 | 이미 존재하는 이메일입니다 | 중복 |
| 500 | 서버 오류가 발생했습니다 | 서버 에러 |

---

## aiTone 값

| 값 | 설명 |
|----|------|
| `warm` | 따뜻하고 공감하는 (기본값) |
| `calm` | 차분하고 안정적인 |
| `cheerful` | 밝고 긍정적인 |
