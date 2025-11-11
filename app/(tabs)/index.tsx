
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function HomeScreen() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [latestText, setLatestText] = useState('');
  const [intervalMs] = useState(3000);
  const serverUrl = 'http://172.31.44.253:5000/api/scan';

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted && permission !== null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    let timer: any;
    if (isCapturing) {
      timer = setInterval(() => captureAndSend(), intervalMs);
    }
    return () => clearInterval(timer);
  }, [isCapturing, intervalMs]);

  async function captureAndSend() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 1.0 });
      if (!photo || !photo.base64) return;
      const res = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photo.base64 }),
      });
      const json = await res.json();
      if (json && json.text) setLatestText(json.text);
    } catch (err: any) {
      console.warn('Capture/send error:', err?.message ?? err);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraWrapper}>
        {Platform.OS === 'web' ? (
          <ThemedText>Camera preview unavailable on web.</ThemedText>
        ) : (
          <CameraView style={styles.camera} ref={cameraRef} facing="back" />
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setIsCapturing((v) => !v)}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            {isCapturing ? 'Stop Scanning' : 'Start Scanning'}
          </ThemedText>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={styles.description}>
          Point your camera at text on another screen and press Start. The app will capture images
          periodically and extract text.
        </ThemedText>

        <ThemedText style={styles.latest}>
          {latestText ? `Latest: ${latestText.substring(0, 120)}` : 'No text captured yet.'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  cameraWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { width: '100%', height: '100%' },
  controls: { padding: 20, backgroundColor: '#f7f7f7' },
  button: { backgroundColor: '#0a84ff', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff' },
  description: { marginTop: 12, color: '#333', lineHeight: 20 },
  latest: { marginTop: 10, color: '#666', fontSize: 13 },
});
