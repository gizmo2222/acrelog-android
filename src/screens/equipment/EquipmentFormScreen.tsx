import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getEquipmentById, getCategories, createEquipment, updateEquipment,
  uploadEquipmentPhotoUrl, setEquipmentPhotos, BUILT_IN_CATEGORIES,
} from '../../services/equipment';
import { getFarm } from '../../services/farms';
import { Category, EquipmentStatus } from '../../types';
import SelectField from '../../components/SelectField';

type Props = NativeStackScreenProps<RootStackParamList, 'EquipmentForm'>;

// Each entry is either an existing URL (isNew=false) or a local URI pending upload (isNew=true)
type PhotoEntry = { uri: string; isNew: boolean };

export default function EquipmentFormScreen({ route, navigation }: Props) {
  const { equipmentId, prefillSerial } = route.params ?? {};
  const { activeFarm } = useAuth();
  const isEdit = !!equipmentId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [farmLocations, setFarmLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState(isEdit ? '' : (prefillSerial ?? ''));
  const [description, setDescription] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [manufacturerUrl, setManufacturerUrl] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

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
        const existing: PhotoEntry[] = [];
        if (eq.primaryImageUrl) existing.push({ uri: eq.primaryImageUrl, isNew: false });
        for (const p of eq.photos ?? []) existing.push({ uri: p.url, isNew: false });
        setPhotos(existing);
      }
    }
    setLoading(false);
  }

  async function addFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => ({ uri: a.uri, isNew: true }))]);
    }
  }

  async function addFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!result.canceled) setPhotos(prev => [...prev, { uri: result.assets[0].uri, isNew: true }]);
  }

  function removePhoto(index: number) {
    Alert.alert('Remove photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setPhotos(prev => prev.filter((_, i) => i !== index)) },
    ]);
  }

  function movePhoto(index: number, dir: -1 | 1) {
    setPhotos(prev => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!name || !brand || !model || !categoryId || !activeFarm) {
      Alert.alert('Please fill in name, brand, model, and category');
      return;
    }
    setSaving(true);
    try {
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
      };
      if (manufacturerUrl.trim()) data.manufacturerUrl = manufacturerUrl.trim();

      let eqId = equipmentId;
      if (isEdit) {
        await updateEquipment(eqId!, data);
      } else {
        const eq = await createEquipment({ ...data, photos: [] });
        eqId = eq.id;
      }

      // Upload any new local photos, resolve all to URLs
      const urls: string[] = [];
      for (const p of photos) {
        if (p.isNew) {
          const url = await uploadEquipmentPhotoUrl(eqId!, activeFarm.farmId, p.uri);
          urls.push(url);
        } else {
          urls.push(p.uri);
        }
      }

      // Write ordered photos + primary back to Firestore
      await setEquipmentPhotos(eqId!, urls[0] ?? null, urls.slice(1));

      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.replace('EquipmentDetail', { equipmentId: eqId! });
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

      {/* Photos section */}
      <View style={styles.photoSection}>
        <Text variant="labelLarge" style={styles.photoLabel}>Photos {photos.length > 0 ? `(${photos.length})` : ''}</Text>
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll} contentContainerStyle={styles.photoScrollContent}>
            {photos.map((p, i) => (
              <View key={i} style={styles.photoItem}>
                <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                {photos.length > 0 && i === 0 && (
                  <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>Primary</Text></View>
                )}
                <TouchableOpacity style={styles.photoDelete} onPress={() => removePhoto(i)}>
                  <Text style={styles.photoDeleteText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.photoArrows}>
                  <TouchableOpacity style={[styles.arrowBtn, i === 0 && styles.arrowBtnDisabled]} onPress={() => movePhoto(i, -1)} disabled={i === 0}>
                    <Text style={styles.arrowText}>‹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.arrowBtn, i === photos.length - 1 && styles.arrowBtnDisabled]} onPress={() => movePhoto(i, 1)} disabled={i === photos.length - 1}>
                    <Text style={styles.arrowText}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={styles.photoBtnRow}>
          <Button icon="camera" mode="outlined" onPress={addFromCamera} style={styles.photoBtn} compact>Camera</Button>
          <Button icon="image-plus" mode="outlined" onPress={addFromLibrary} style={styles.photoBtn} compact>Library</Button>
        </View>
      </View>

      <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label="Brand *" value={brand} onChangeText={setBrand} mode="outlined" style={styles.input} />
      <TextInput label="Model *" value={model} onChangeText={setModel} mode="outlined" style={styles.input} />
      <TextInput label="Serial Number" value={serial} onChangeText={setSerial} mode="outlined" style={styles.input} />
      <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} multiline numberOfLines={3} />
      <TextInput label="Purchase Location" value={purchaseLocation} onChangeText={setPurchaseLocation} mode="outlined" style={styles.input} />
      {farmLocations.length > 0 ? (
        <SelectField label="Storage Location" value={location} options={farmLocations} onChange={setLocation} allowClear style={styles.input} />
      ) : (
        <TextInput label="Storage Location" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />
      )}
      <TextInput label="Manufacturer URL" value={manufacturerUrl} onChangeText={setManufacturerUrl} mode="outlined" style={styles.input} keyboardType="url" autoCapitalize="none" />

      <Divider style={styles.divider} />
      <SelectField
        label="Category *"
        value={categories.find(c => c.id === categoryId)?.name ?? ''}
        options={categories.map(c => c.name)}
        onChange={(name) => {
          const cat = categories.find(c => c.name === name);
          if (!cat) return;
          const hasData = Object.values(customFields).some(v => v);
          if (hasData) {
            Alert.alert('Change Category?', 'Switching categories will clear the current field values.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Change', onPress: () => { setCategoryId(cat.id); setCustomFields({}); } },
            ]);
          } else {
            setCategoryId(cat.id);
            setCustomFields({});
          }
        }}
        style={styles.input}
      />

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
  photoSection: { marginBottom: 16 },
  photoLabel: { marginBottom: 8, color: '#555' },
  photoScroll: { marginBottom: 8 },
  photoScrollContent: { gap: 8, paddingBottom: 4 },
  photoItem: { position: 'relative', width: 120 },
  photoThumb: { width: 120, height: 100, borderRadius: 8, resizeMode: 'cover' },
  primaryBadge: { position: 'absolute', bottom: 28, left: 4, backgroundColor: 'rgba(46,125,50,0.85)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  primaryBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  photoDelete: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  photoDeleteText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  photoArrows: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  arrowBtn: { flex: 1, alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 4, paddingVertical: 2, marginHorizontal: 1 },
  arrowBtnDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 18, lineHeight: 22, color: '#333' },
  photoBtnRow: { flexDirection: 'row', gap: 8 },
  photoBtn: { flex: 1 },
  input: { marginBottom: 12 },
  divider: { marginVertical: 16 },
  saveBtn: { marginTop: 8, marginBottom: 32 },
});
