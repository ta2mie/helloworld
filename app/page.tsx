'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [items, setItems] = useState<any[]>([])
  const [inputWord, setInputWord] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. READ: Fetch items from Supabase on load
  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching items:', error)
    else setItems(data || [])
  }

  // 2. CREATE: Call AI API and store input + translation in DB
  async function handleTranslateAndSave(e: React.FormEvent) {
    e.preventDefault()
    if (!inputWord.trim() || loading) return

    setLoading(true)

    try {
      // Call our Next.js backend AI route
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: inputWord }),
      })

      const data = await res.json()

      if (data.error) {
        alert(`AI Translation Error: ${data.error}`)
        setLoading(false)
        return
      }

      // Store both English word and AI translation in Supabase table
      const { error: dbError } = await supabase
        .from('items')
        .insert([{ title: data.english, translation: data.translation }])

      if (dbError) {
        alert(`Database Error: ${dbError.message}`)
      } else {
        setInputWord('')
        fetchItems()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to connect to translation server')
    } finally {
      setLoading(false)
    }
  }

  // 3. DELETE: Remove item from database
  async function deleteItem(id: number) {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) console.error('Error deleting item:', error)
    else fetchItems()
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      {/* Static Header Section */}
      <section style={{ marginBottom: '30px', padding: '20px', background: '#f4f4f5', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#18181b' }}>AI Translation & Database 101</h1>
        <p style={{ margin: 0, color: '#52525b' }}>
          Type an English word below. The server calls OpenRouter AI to translate it to Traditional Chinese, then saves the pair to your Supabase PostgreSQL database!
        </p>
      </section>

      {/* Input Form */}
      <form onSubmit={handleTranslateAndSave} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Enter English word (e.g. Computer)..."
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8', color: '#09090b', background: '#ffffff' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: loading ? '#93c5fd' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Translating...' : 'Translate & Save'}
        </button>
      </form>

      {/* Saved Database Items List */}
      <h2>Translation History:</h2>
      {items.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No translations stored in the database yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e4e4e7',
              }}
            >
              <div>
                <strong style={{ fontSize: '18px' }}>{item.title}</strong>
                <span style={{ margin: '0 10px', color: '#a1a1aa' }}>➔</span>
                <span style={{ fontSize: '18px', color: '#16a34a', fontWeight: 'bold' }}>
                  {item.translation || '(Pending translation)'}
                </span>
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}