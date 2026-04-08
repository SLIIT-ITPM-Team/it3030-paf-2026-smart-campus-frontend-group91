import React, { useState, useEffect } from 'react';
import api from '../api/api';

const Test = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                // Testing GET /test endpoint
                const response = await api.get('/test');
                // Check if response has data. The user specifically wants to handle the response string.
                // Assuming it returns plain text "Backend working!"
                setData(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Error fetching data');
                setLoading(false);
            }
        };

        fetchTest();
    }, []);

    if (loading) return <div>Loading backend connection...</div>;
    if (error) return <div style={{ color: 'red' }}>Error connecting to backend: {error}</div>;

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', margin: '20px auto', borderRadius: '8px', maxWidth: '400px' }}>
            <h2>Backend Status</h2>
            <p><strong>Response:</strong> {data}</p>
        </div>
    );
};

export default Test;
