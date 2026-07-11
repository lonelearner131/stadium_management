/**
 * Custom hook for live stadium insight polling logic.
 *
 * @module hooks/useLiveInsight
 */
import { useState, useEffect } from 'react';
import { getAllCrowdStatuses, type CrowdStatus } from '@/lib/data/crowd-simulation';

export function useLiveInsight() {
  const [statuses, setStatuses] = useState<CrowdStatus[]>([]);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    const fetchInsight = () => {
      const data = getAllCrowdStatuses();
      setStatuses(data);

      const lowWait = data.filter((d) => d.density === 'low');
      if (lowWait.length > 0) {
        setRecommendation(`💡 Quickest Entry: Head to ${lowWait.map((d) => d.location).join(' or ')} for fastest access.`);
      } else {
        const mediumWait = data.filter((d) => d.density === 'medium');
        if (mediumWait.length > 0) {
          setRecommendation(`💡 Best Option: ${mediumWait[0].location} has moderate lines.`);
        } else {
          setRecommendation('💡 All gates are currently busy. Enjoy the concourse amenities while waiting.');
        }
      }
    };

    fetchInsight();
    const interval = setInterval(fetchInsight, 10000);
    return () => clearInterval(interval);
  }, []);

  return { statuses, recommendation };
}
