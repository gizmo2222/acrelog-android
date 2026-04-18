import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { getEquipmentBySerial } from '../../services/equipment';

type Props = NativeStackScreenProps<RootStackParamList, 'SerialScan'>;

export default function SerialScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState('');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={styles.center}><ActivityIndicator /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={styles.message}>Camera permission is required</Text>
        <Button mode="contained" onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      if (!photo?.base64) throw new Error('Failed to capture image');

      // Use Google Cloud Vision OCR via a simple fetch
      // Falls back to manual entry if no API key configured
      const apiKey = process.env.EXPO_PUBLIC_VISION_API_KEY;
      let serialText = '';

      if (apiKey) {
        const response = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{
                image: { content: photo.base64 },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              }],
            }),
          }
        );
        const data = await response.json();
        serialText = data.responses?.[0]?.fullTextAnnotation?.text ?? '';
      }

      if (!serialText) {
        Alert.alert(
          'No text detected',
          'Could not read text from the image. Enter serial number manually.',
          [{ text: 'OK', onPress: () => navigation.navigate('EquipmentForm', {}) }]
        );
        return;
      }

      // Extract likely serial number (alphanumeric sequences 6+ chars)
      const lines = serialText.split('\n').map(l => l.trim()).filter(Boolean);
      const serialCandidate = lines.find(l => /^[A-Z0-9\-]{6,}$/i.test(l)) ?? lines[0];
      setDetected(serialCandidate);

      const equipment = await getEquipmentBySerial(serialCandidate);
      if (equipment) {
        navigation.replace('MaintenanceSchedule', { equipmentId: equipment.id });
      } else {
        Alert.alert(
          'Equipment Not Found',
          `Serial: ${serialCandidate}\nNo matching equipment found. Add it now?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Equipment', onPress: () => navigation.replace('EquipmentForm', { prefillSerial: serialCandidate }) },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera}>
        <View style={styles.overlay}>
          <View style={styles.scanBox} />
          <Text style={styles.hint}>Position serial number within the box</Text>
        </View>
      </CameraView>

      <View style={styles.footer}>
        {detected ? <Text style={styles.detected}>Detected: {detected}</Text> : null}
        <Button
          mode="contained"
          onPress={handleCapture}
          loading={scanning}
          style={styles.captureBtn}
          icon="camera"
        >
          Capture
        </Button>
        <Button onPress={() => navigation.navigate('EquipmentForm', {})}>Enter Manually</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  message: { marginBottom: 16, textAlign: 'center' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 280, height: 120, borderWidth: 2, borderColor: '#2e7d32', borderRadius: 8, backgroundColor: 'transparent' },
  hint: { color: 'white', marginTop: 12, fontSize: 13 },
  footer: { backgroundColor: '#111', padding: 24, alignItems: 'center' },
  detected: { color: 'white', marginBottom: 12 },
  captureBtn: { width: '100%', marginBottom: 8 },
});
