import React, { useEffect, useState } from 'react'
import { View, FlatList, Text, Image, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 10

interface Pin {
  id: number
  image_url: string
  title: string
  description: string
  created_at: string
}

export default function Feeds() {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Parse token from URL hash and set session
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        }).then(({ error }) => {
          if (error) {
            Alert.alert('Error setting session', error.message)
          } else {
            setSessionReady(true)
            // Clean URL to remove tokens from address bar
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        })
      } else {
        setSessionReady(true)
      }
    } else {
      setSessionReady(true)
    }
  }, [])

  // Fetch pins only after session is ready
  useEffect(() => {
    if (!sessionReady) return
    fetchPins(true)
  }, [sessionReady])

  const fetchPins = async (reset = false) => {
    if (loadingMore || (reset === false && !hasMore)) return

    if (reset) {
      setPage(0)
      setHasMore(true)
    }

    const start = reset ? 0 : page * PAGE_SIZE
    const end = start + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) {
      console.error(error)
    } else {
      const newPins = reset ? data : [...pins, ...data]
      setPins(newPins)
      if (data.length < PAGE_SIZE) setHasMore(false)
      if (!reset) setPage((prev) => prev + 1)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPins(true)
    setRefreshing(false)
  }

  const onEndReached = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      fetchPins()
    }
  }

  const renderItem = ({ item }: { item: Pin }) => (
    <View style={styles.pinContainer}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  )

  if (!sessionReady || loading && pins.length === 0) {
    return (
      <View style={styles.wrapper}>
        <ActivityIndicator size="large" color="red" />
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={pins}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="gray" /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  pinContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
})
