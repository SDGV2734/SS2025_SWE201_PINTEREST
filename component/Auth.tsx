import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'
import { red100 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors'

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithMagicLink() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'yourapp://callback', // optional deep link for mobile apps
      },
    })

    if (error) {
      Alert.alert('Error sending magic link', error.message)
    } else {
      Alert.alert('Check your email for the magic link!')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Send Magic Link" disabled={loading} onPress={signInWithMagicLink} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 350,
    padding: 12,
    
  },
  verticallySpaced: {
    paddingTop: 40,
    paddingBottom: 4,
    alignSelf: 'stretch',
    
  },
  mt20: {
    marginTop: 20,
    
  },
})