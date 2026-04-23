import { useState, useEffect } from 'react';
import './SlaPanel.css';

const minutesSince = (dateStr) => {
  if (!dateStr) return 0;
  return (Date.now() - new Date(dateStr).getTime()) / 60000;
};

const formatCountdown = (remainingMinutes) => {
  if (remainingMinutes <= 0) return null;
  const totalSeconds = Math.floor(remainingMinutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const SlaPanel = ({ ticket }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!ticket?.createdAt || !ticket?.priority) return null;

  const slaFR = ticket.slaFirstResponseMinutes;
  const slaRes = ticket.slaResolutionMinutes;

  const frDone = !!ticket.firstResponseAt;
  const frElapsed = frDone
    ? ticket.timeToFirstResponseMinutes
    : minutesSince(ticket.createdAt);
  const frRemaining = slaFR - frElapsed;
  const frCountdown = !frDone ? formatCountdown(frRemaining) : null;

  const resDone = !!ticket.resolvedAt;
  const resElapsed = resDone
    ? ticket.timeToResolutionMinutes
    : minutesSince(ticket.createdAt);
  const resRemaining = slaRes - resElapsed;
  const resCountdown = !resDone ? formatCountdown(resRemaining) : null;

  return (
    <div className="sla-panel">
      <div className="sla-title">SLA Metrics</div>

      <div className="sla-row">
        <span className="sla-label">First Response</span>
        {frDone ? (
          <span className={`sla-result ${ticket.firstResponseSlaMet ? 'met' : 'violated'}`}>
            {ticket.firstResponseSlaMet ? '✅' : '❌'} {ticket.timeToFirstResponseMinutes} min
            <span className="sla-limit"> / {slaFR} min SLA</span>
          </span>
        ) : frCountdown ? (
          <span className="sla-countdown">⏳ {frCountdown} left</span>
        ) : (
          <span className="sla-violated">❌ SLA Violated</span>
        )}
      </div>

      <div className="sla-row">
        <span className="sla-label">Resolution</span>
        {resDone ? (
          <span className={`sla-result ${ticket.resolutionSlaMet ? 'met' : 'violated'}`}>
            {ticket.resolutionSlaMet ? '✅' : '❌'} {ticket.timeToResolutionMinutes} min
            <span className="sla-limit"> / {slaRes} min SLA</span>
          </span>
        ) : resCountdown ? (
          <span className="sla-countdown">⏳ {resCountdown} left</span>
        ) : (
          <span className="sla-violated">❌ SLA Violated</span>
        )}
      </div>

      <div className="sla-info">
        Priority: <strong>{ticket.priority}</strong> · FR: {slaFR}m · Res: {slaRes}m
      </div>
    </div>
  );
};

export default SlaPanel;
