# AI 사주 풀이 (로컬용)

생년월일시를 입력하면 **만세력 라이브러리로 사주팔자를 계산**하고, **Claude가 풀이**해 주는 웹사이트입니다.
Claude는 API 사용료가 따로 나가는 방식이 아니라 **내 Claude 구독(Pro/Max)** 으로 동작합니다.

> ⚠️ 구독 로그인 방식은 **나 혼자 내 컴퓨터에서 쓰는 용도**까지만 허용됩니다.
> 다른 사람에게 서비스로 공개하려면 API 키 방식으로 바꿔야 합니다. (`src/lib/claude/interpret.ts` 한 곳만 고치면 됩니다)

## 준비물

- [Node.js](https://nodejs.org) 20 이상
- Claude Pro 또는 Max 구독
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)

## 실행 방법

```bash
# 1. 필요한 패키지 설치
npm install

# 2. 구독용 토큰 발급 (브라우저가 열리면 Claude 계정으로 로그인)
claude setup-token

# 3. 설정 파일을 만들고, 2번에서 나온 토큰을 CLAUDE_CODE_OAUTH_TOKEN= 뒤에 붙여넣기
cp .env.example .env.local

# 4. 실행
npm run dev
```

브라우저에서 <http://localhost:3000> 을 열면 됩니다.

- 이미 이 컴퓨터에서 `claude` 명령으로 로그인해 둔 상태라면 3번 토큰 없이도 동작할 수 있습니다.
- `ANTHROPIC_API_KEY` 환경변수가 있어도 이 앱은 일부러 무시합니다. (실수로 종량제 요금이 나가지 않도록)

## 기능

- 양력·음력(윤달 포함) 입력, 태어난 시간 모름 허용
- 사주팔자 표: 천간·지지, 오행, 십신, 지장간, 12운성
- 대운(10년 단위 운)과 올해 세운
- Claude 풀이가 실시간으로 한 글자씩 표시(스트리밍)
- 풀이 후 채팅으로 추가 질문 (새로고침하면 대화는 사라집니다)

## 시간 보정 규칙

| 항목 | 설명 |
|---|---|
| 진태양시 | 한국 시계는 동경 135° 기준이라 실제 해의 위치와 차이가 납니다. 출생지 경도로 보정합니다. (서울 약 −32분) |
| 서머타임 | 1948~1951, 1955~1960, 1987~1988년 시행 기간 출생이면 1시간을 뺍니다. |
| 1954~1961년 표준시 | 이 시기 한국 표준시는 UTC+8:30(동경 127.5°)이었습니다. 자동으로 반영합니다. |
| 절기 기준 | 년주·월주는 입춘·절기 시각을 기준으로, 실제 출생 순간으로 판정합니다. |
| 야자시 | 기본은 밤 11시부터 다음 날 일주. 설정에서 "야자시 적용"을 켜면 자정까지 당일 일주로 계산합니다. |

과거 표준시·서머타임 정보는 Node.js에 내장된 시간대 데이터(`Asia/Seoul`)를 사용합니다.

## 개발

```bash
npm test          # 사주 계산 테스트
npm run typecheck # 타입 검사
npm run build     # 배포용 빌드
```

### 폴더 구조

```
src/
  app/page.tsx                 화면 (입력 → 사주표 → 풀이/대화)
  app/api/saju/route.ts        사주 계산 API
  app/api/interpret/route.ts   Claude 풀이 API (스트리밍)
  components/                  입력 폼, 사주표, 대화창
  lib/saju/                    만세력 계산, 시간 보정, 십신/12운성
  lib/claude/                  Claude 호출과 프롬프트
```

풀이 내용이나 말투를 바꾸고 싶으면 `src/lib/claude/prompts.ts` 를 수정하세요.
