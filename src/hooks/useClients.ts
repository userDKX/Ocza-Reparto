import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageCompression'
import type { Client } from '../types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('name')
    setClients(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  async function createClient(
    client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'photo_url' | 'active'>,
    photo?: File
  ) {
    let photo_url: string | null = null

    if (photo) {
      photo_url = await uploadPhoto(crypto.randomUUID(), photo)
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...client, photo_url })
      .select()
      .single()

    if (error) throw error
    setClients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  async function updateClient(
    id: string,
    updates: Partial<Omit<Client, 'id' | 'created_at'>>,
    photo?: File
  ) {
    if (photo) {
      updates.photo_url = await uploadPhoto(id, photo)
    }

    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }

  async function deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .update({ active: false })
      .eq('id', id)

    if (error) throw error
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  return { clients, loading, fetchClients, createClient, updateClient, deleteClient }
}

async function uploadPhoto(clientId: string, file: File): Promise<string> {
  const compressed = await compressImage(file)
  const path = `${clientId}.webp`

  const { error } = await supabase.storage
    .from('client-photos')
    .upload(path, compressed, { upsert: true, contentType: 'image/webp' })

  if (error) throw error

  const { data } = supabase.storage.from('client-photos').getPublicUrl(path)
  return data.publicUrl
}
