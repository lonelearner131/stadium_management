'use client';


import { useLiveInsight } from '@/hooks/useLiveInsight';

/**
 * Live Stadium Insight panel
 * Demonstrates Operational Intelligence by showing real-time aggregated crowd density
 * across all gates, helping fans make informed decisions.
 */
export function LiveStadiumInsight() {
  const { statuses, recommendation } = useLiveInsight();

  if (statuses.length === 0) return null;

  return (
    <div className="live-insight-panel" role="region" aria-label="Live Stadium Insight">
      <div className="insight-header">
        <span className="insight-title">📊 Live Stadium Insight</span>
        <span className="insight-live-badge">● LIVE</span>
      </div>
      <div className="insight-content">
        <p className="insight-recommendation">{recommendation}</p>
        <div className="insight-grid">
          {statuses.map((status) => (
            <div key={status.location} className="insight-card">
              <div className="insight-gate">{status.location}</div>
              <div className={`insight-density ${status.density}`}>
                {status.density === 'low' ? '🟢 Low' : status.density === 'medium' ? '🟡 Med' : '🔴 High'}
              </div>
              <div className="insight-wait">{status.estimatedWaitMinutes} min wait</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
