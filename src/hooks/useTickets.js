import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

export const useTickets = (currentRole) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, setTickets, loading, fetchTickets };
};
