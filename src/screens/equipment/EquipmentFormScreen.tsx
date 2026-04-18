import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, SegmentedButtons, Divider, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getEquipmentById, getCategories, createEquipment, updateEquipment,
  uploadPrimaryImage, BUILT_IN_CATEGORIES,
} from '../../services/equipment';
import { getFarm } from '../../services/farms';
import { Category, Equipment, EquipmentStatus } from '../../types';
import SelectField from '../../components/SelectField';

type Props = NativeStackScreenProps<RootStackParamList, 'EquipmentForm'>;

export default function EquipmentFormScreen({ route, navigation }: Props) {
  const { equipmentId, prefillSerial } = route.params ?? {};
  const { activeFarm } = useAuth();
  const isEdit = !!equipmentId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [farmLocations, setFarmLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [primaryImageUri, setPrimaryImageUri] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState(prefillSerial ?? '');
  const [description, setDescription] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [manufacturerUrl, setManufacturerUrl] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!activeFarm) return;
    const [cats, farm] = await Promise.all([
      getCategories(activeFarm.farmId),
      getFarm(activeFarm.farmId),
    ]);
    setCategories(cats);
    setFarmLocations((farm?.locations ?? []).sort());
    if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);

    if (isEdit) {
      const eq = await getEquipmentById(equipmentId!);
      if (eq) {
        setName(eq.name);
        setBrand(eq.brand);
        setModel(eq.model);
        setSerial(eq.serialNumber);
        setDescription(eq.description);
        setPurchaseLocation(eq.purchaseLocation);
        setLocation(eq.location);
        setCategoryId(eq.categoryId);
        setManufacturerUrl(eq.manufacturerUrl ?? '');
        setCustomFields(eq.customFields ?? {});
        if (eq.primaryImageUrl) setPrimaryImageUri(eq.primaryImageUrl);
      }
    }
    setLoading(false);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setPrimaryImageUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, cameraType: ImagePicker.CameraType.back });
    if (!result.canceled) setPrimaryImageUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!name || !brand || !model || !categoryId || !activeFarm) {
      Alert.alert('Please fill in name, brand, model, and category');
      return;
    }
    setSaving(true);
    try {
      // Strip undefined/empty optional fields so Firestore doesn't reject them
      const data: any = {
        farmId: activeFarm.farmId,
        categoryId,
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serial.trim(),
        description: description.trim(),
        purchaseLocation: purchaseLocation.trim(),
        location: location.trim(),
        customFields,
        status: 'active' as EquipmentStatus,
        totalHours: 0,
        photos: [],
      };
      if (manufacturerUrl.trim()) data.manufacturerUrl = manufacturerUrl.trim();

      console.log('[EquipmentForm] saving data:', JSON.stringify(data));

      if (isEdit) {
        await updateEquipment(equipmentId!, data);
        if (primaryImageUri && !primaryImageUri.startsWith('http')) {
          await uploadPrimaryImage(equipmentId!, activeFarm.farmId, primaryImageUri);
        }
        navigation.goBack();
      } else {
        const eq = await createEquipment(data);
        console.log('[EquipmentForm] created equipment id:', eq.id);
        if (primaryImageUri) {
          await uploadPrimaryImage(eq.id, activeFarm.farmId, primaryImageUri);
        }
        navigation.navigate('EquipmentDetail', { equipmentId: eq.id });
      }
    } catch (e: any) {
      console.error('[EquipmentForm] save error:', e);
      Alert.alert('Error saving equipment', e.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find(c => c.id === categoryId);

  const insets = useSafeAreaInsets();

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <KeyboardAvoidingView style={styles.kavWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} keyboardShouldPersistTaps="handled">
      {/* Primary image */}
      <View style={styles.imageSection}>
        {primaryImageUri ? (
          <Image source={{ uri: primaryImageUri }} style={styles.primaryImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No photo</Text>
          </View>
        )}
        <View style={styles.imageBtnRow}>
          <Button icon="camera" mode="outlined" onPress={takePhoto} style={styles.imageBtn}>
            Camera
          </Button>
          <Button icon="image" mode="outlined" onPress={pickImage} style={styles.imageBtn}>
            Library
          </Button>
        </View>
      </View>

      <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label="Brand *" value={brand} onChangeText={setBrand} mode="outlined" style={styles.input} />
      <TextInput label="Model *" value={model} onChangeText={setModel} mode="outlined" style={styles.input} />
      <TextInput label="Serial Number" value={serial} onChangeText={setSerial} mode="outlined" style={styles.input} />
      <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} multiline numberOfLines={3} />
      <TextInput label="Purchase Location" value={purchaseLocation} onChangeText={setPurchaseLocation} mode="outlined" style={styles.input} />
      {farmLocations.length > 0 ? (
        <SelectField
          label="Storage Location"
          value={location}
          options={farmLocations}
          onChange={setLocation}
          allowClear
          style={styles.input}
        />
      ) : (
        <TextInput label="Storage Location" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
      )}
      <TextInput label="Manufacturer URL" value={manufacturerUrl} onChangeText={setManufacturerUrl} mode="outlined" style={styles.input} keyboardType="url" autoCapitalize="none" />

      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            mode={categoryId === cat.id ? 'contained' : 'outlined'}
            onPress={() => { setCategoryId(cat.id); setCustomFields({}); }}
            compact
            style={styles.categoryBtn}
          >
            {cat.name}
          </Button>
        ))}
      </ScrollView>

      {/* Dynamic custom fields for selected category */}
      {selectedCategory?.defaultFields.map((field) =>
        field.type === 'select' && field.options?.length ? (
          <SelectField
            key={field.key}
            label={field.label}
            value={customFields[field.key] ?? ''}
            options={field.options}
            onChange={(v) => setCustomFields({ ...customFields, [field.key]: v })}
            allowClear
            style={styles.input}
          />
        ) : (
          <TextInput
            key={field.key}
            label={field.label}
            value={customFields[field.key] ?? ''}
            onChangeText={(v) => setCustomFields({ ...customFields, [field.key]: v })}
            mode="outlined"
            style={styles.input}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          />
        )
      )}

      <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn}>
        {isEdit ? 'Save Changes' : 'Add Equipment'}
      </Button>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kavWrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageSection: { alignItems: 'center', marginBottom: 16 },
  primaryImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 8 },
  imagePlaceholder: { width: '100%', height: 120, backgroundColor: '#ddd', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  imagePlaceholderText: { color: '#999' },
  imageBtnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  imageBtn: { flex: 1 },
  input: { marginBottom: 12 },
  divider: { marginVertical: 16 },
  sectionTitle: { fontWeight: 'bold', color: '#2e7d32', marginBottom: 8 },
  categoryScroll: { marginBottom: 16 },
  categoryBtn: { marginRight: 8 },
  saveBtn: { marginTop: 8, marginBottom: 32 },
});
