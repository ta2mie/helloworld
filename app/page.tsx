'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [items, setItems] = useState<any[]>([])
  const [inputTitle, setInputTitle] = useState('')

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

  // 2. CREATE: Add new item to database
  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!inputTitle.trim()) return

    const { error } = await supabase.from('items').insert([{ title: inputTitle }])
    if (error) {
      console.error('Error adding item:', error)
      alert(`Database Error: ${error.message}`)
    } else {
      setInputTitle('')
      fetchItems()
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
      {/* Static Part */}
      <section style={{ marginBottom: '30px', padding: '20px', background: '#f4f4f5', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px',color: '#52525b' }}>Static & Dynamic 101 Test Page</h1>
        <p style={{ margin: 0, color: '#52525b' }}>
          This header is static. Below is powered dynamically by your live Supabase PostgreSQL database!
        </p>
      </section>

      {/* Dynamic Form (Create) */}
      <form onSubmit={addItem} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Type item title..."
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          style={{ color: '#52525b', flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8' }}
        />
        <button 
          type="submit" 
          style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Add to DB
        </button>
      </form>

      {/* Dynamic List (Read & Delete) */}
      <h2>Database Items List:</h2>
      {items.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No items in database yet. Type a title above and click Add!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li 
              key={item.id} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e4e4e7' }}
            >
              <span style={{ fontSize: '16px' }}>{item.title}</span>
              <button 
                onClick={() => deleteItem(item.id)} 
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
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