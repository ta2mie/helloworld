'use client';

import { useState } from 'react';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setLoading(true);
    setResult('');
    setSaveStatus('');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process job description');
      }

      setResult(data.result);
      setSaveStatus(data.saved ? 'Saved to database successfully!' : 'Processed (database save skipped)');

    } catch (err: any) {
      console.error(err);
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Job Description AI Analyzer</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            Paste Job Description here and skill-based description will be added:
          </label>
          <textarea
            id="jobDescription"
            rows={8}
            className="w-full p-3 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Processing with AI...' : 'Analyze & Save'}
        </button>
      </form>

      {/* Output Display */}
      {result && (
        <div className="mt-6 p-4 border rounded-lg bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
          <h2 className="text-lg font-semibold mb-2">AI Response:</h2>
          <pre className="whitespace-pre-wrap text-sm font-sans">{result}</pre>
          
          {saveStatus && (
            <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ {saveStatus}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
