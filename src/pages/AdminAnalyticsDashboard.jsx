// MY CONTRIBUTION: Admin Analytics Dashboard for Module A
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api from '../api/api';
import './UserDashboard.css';

const AdminAnalyticsDashboard = () => {
  const [summary, setSummary] = useState({
    totalBookingsToday: 0,
    activeResources: 0,
    topResources: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/analytics/summary', {
          headers: { 'X-User-Role': 'ADMIN' },
        });
        setSummary(response.data || {});
      } catch (err) {
        const status = err?.response?.status;
        if (status === 403) setError('Unauthorized: Admin access required.');
        else if (status === 400) setError('Bad request: Invalid analytics query.');
        else setError('Unable to load analytics right now.');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  return (
    <section className="udash-grid">
      <article className="udash-card udash-grid-wide">
        <h2>Admin Analytics</h2>
        <p className="udash-sub">Facilities & Assets booking insights.</p>
      </article>

      {loading ? (
        <article className="udash-card udash-grid-wide">Loading analytics...</article>
      ) : null}

      {error ? (
        <article className="udash-card udash-grid-wide udash-error">{error}</article>
      ) : null}

      <article className="udash-card">
        <h3>Total Bookings Today</h3>
        <div className="udash-kpi">{summary.totalBookingsToday || 0}</div>
      </article>

      <article className="udash-card">
        <h3>Active Resources</h3>
        <div className="udash-kpi">{summary.activeResources || 0}</div>
      </article>

      <article className="udash-card udash-grid-wide">
        <h3>Top Resources</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.topResources || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookingCount" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
};

export default AdminAnalyticsDashboard;
