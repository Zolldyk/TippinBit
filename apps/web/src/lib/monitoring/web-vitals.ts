import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

interface MetricReport {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function reportMetric(metric: MetricReport) {
  // Development: Log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value}ms (${metric.rating})`);
  }

  // Production: Send to analytics (PostHog, Vercel Analytics, etc.)
  // TODO: Enable in production
  // analytics.track('web_vital', {
  //   metric: metric.name,
  //   value: metric.value,
  //   rating: metric.rating,
  // });
}

export function initWebVitals() {
  onLCP((metric: Metric) => reportMetric({
    name: 'LCP',
    value: metric.value,
    rating: metric.value < 2500 ? 'good' : metric.value < 4000 ? 'needs-improvement' : 'poor',
  }));

  // INP (Interaction to Next Paint) replaced FID in web-vitals v3+
  // Thresholds: good < 200ms, needs-improvement < 500ms, poor >= 500ms
  onINP((metric: Metric) => reportMetric({
    name: 'INP',
    value: metric.value,
    rating: metric.value < 200 ? 'good' : metric.value < 500 ? 'needs-improvement' : 'poor',
  }));

  onCLS((metric: Metric) => reportMetric({
    name: 'CLS',
    value: metric.value,
    rating: metric.value < 0.1 ? 'good' : metric.value < 0.25 ? 'needs-improvement' : 'poor',
  }));
}
