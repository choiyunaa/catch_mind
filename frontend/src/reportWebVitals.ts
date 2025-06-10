// ✅ 수정된 코드
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);  // ✅ 여기 주목!
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
