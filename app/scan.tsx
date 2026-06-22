import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { goBack } from '@/lib/nav';
import { scanReceipt } from '@/lib/scan';
import { useKitchen } from '@/store/kitchen-store';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const setPendingScan = useKitchen((s) => s.setPendingScan);

  const onCapture = async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      const items = photo?.base64 ? await scanReceipt(photo.base64) : null;
      if (items === null) {
        Alert.alert(
          'Couldn’t scan that',
          'The scanner couldn’t be reached. Check your connection (and that the scan-receipt function is set up), then try again.',
        );
        return;
      }
      if (items.length === 0) {
        Alert.alert('No items found', 'Try again with the full receipt in frame and good lighting.');
        return;
      }
      setPendingScan(items);
      router.replace('/scan-review');
    } catch {
      Alert.alert('Something went wrong', 'Please try capturing the receipt again.');
    } finally {
      setBusy(false);
    }
  };

  // Permission still loading.
  if (!permission) return <View style={styles.root} />;

  // Permission not granted yet.
  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={48} color="#fff" />
        <Text style={styles.permText}>
          Camera access is needed to scan your grocery receipts.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 16 }}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.hint}>Frame your receipt</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.viewfinder} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 28 }]}>
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={Colors.yellow} />
            <Text style={styles.caption}>Reading your receipt…</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.shutter} activeOpacity={0.8} onPress={onCapture}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <Text style={styles.caption}>Tap to scan · we’ll pull out your groceries</Text>
          </>
        )}
      </View>
    </View>
  );
}

const FRAME = 280;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b1b1b' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  permText: { fontFamily: Fonts.sans, fontSize: 15, color: '#fff', textAlign: 'center', lineHeight: 22 },
  permBtn: { backgroundColor: Colors.yellow, borderRadius: 20, paddingHorizontal: 24, height: 44, justifyContent: 'center' },
  permBtnText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  cancel: { fontFamily: Fonts.sans, fontSize: 14, color: '#ccc' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  hint: { fontFamily: Fonts.sansMedium, fontSize: 14, color: '#fff' },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  bottomBar: { alignItems: 'center', paddingHorizontal: 20 },
  busy: { alignItems: 'center', gap: 12 },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.yellow },
  caption: { fontFamily: Fonts.sans, fontSize: 12, color: '#ccc', marginTop: 14, textAlign: 'center' },
});
