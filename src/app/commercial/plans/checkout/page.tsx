'use client';

import { useState } from 'react';
import { createInvestment } from '@/services/planService';

export default function InvestPage() {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await createInvestment({
        investmentAmount: Number(amount),
      });

      setResponse(data);
    } catch (err: any) {
      setError('Error al crear la inversión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Crear inversión</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Monto:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ marginLeft: '1rem' }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Submit'}
        </button>
      </form>

      {response && (
        <pre style={{ marginTop: '1rem' }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>
      )}
    </div>
  );
}