import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState, Text, Image } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'

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
        emailRedirectTo: 'yourapp://callback',
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
      <Image source={require('../assets/Brand_Guidelines_hero_2x.webp')} style={{width: 200, height: 200, alignSelf: 'center', marginTop: -300}}/>

        <Text style={{ fontSize: 24, fontWeight: 'bold',textAlign : 'center'}}>Welcome</Text>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>Sign in with your email</Text>
          <Input
            placeholder="example@mail.com"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(text) => setEmail(text)}
            value={email}
            leftIcon={{ name: 'envelope', type: 'font-awesome', size: 20, color: 'black' }}
            containerStyle={{ marginTop: 20 }}
            inputContainerStyle={{ borderBottomWidth: 1, borderBottomColor: 'black' }}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Send Magic Link" disabled={loading} onPress={signInWithMagicLink}
        buttonStyle={{ backgroundColor: 'red'}} loading={loading}
        titleStyle={{ fontWeight: 'bold' }} icon={{ name: 'envelope', type: 'font-awesome', size: 20, color: 'white' }}
        />
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