# Design System v3 — 설정 가이드

## 필수 폰트 다운로드

Google Fonts에서 다음 폰트를 다운로드하여 `mobile/assets/fonts/`에 배치:

1. **Playfair Display** (serif, editorial)
   - PlayfairDisplay-Regular.ttf
   - PlayfairDisplay-Italic.ttf
   - PlayfairDisplay-Medium.ttf

2. **Inter** (sans-serif, UI/body)
   - Inter-Light.ttf
   - Inter-Regular.ttf
   - Inter-Medium.ttf
   - Inter-SemiBold.ttf

3. **Caveat** (script, handwritten)
   - Caveat-Regular.ttf
   - Caveat-Medium.ttf

## 권장 추가 패키지

종이 질감과 글래스 효과를 위해:

```bash
cd mobile
npx expo install react-native-svg expo-blur
```

- `react-native-svg`: SVG 기반 noise texture 렌더링
- `expo-blur`: 바텀시트 backdrop blur 효과

현재는 이 패키지 없이도 fallback 스타일로 동작합니다.

## expo-font 설정

`app.config.ts`에 `expo-font` 플러그인이 이미 포함되어 있습니다.
폰트 로딩은 `buildFontAssets()`를 사용:

```tsx
import { useFonts } from 'expo-font';
import { buildFontAssets } from './design-system-v3';

const [fontsLoaded] = useFonts(buildFontAssets());
```
