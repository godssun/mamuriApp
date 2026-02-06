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
  "content": "오늘 하루는 정말 힘들었다..."
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "오늘의 일기",
    "content": "오늘 하루는 정말 힘들었다...",
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

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "오늘의 일기",
      "content": "오늘 하루는 정말 힘들었다...",
      "aiComment": {
        "id": 1,
        "content": "힘든 하루를 보내셨군요...",
        "createdAt": "2024-02-07T10:30:00"
      },
      "createdAt": "2024-02-07T10:30:00",
      "updatedAt": "2024-02-07T10:30:00"
    }
  ]
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
  "content": "수정된 내용"
}
```

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
