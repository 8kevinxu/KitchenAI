import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';

/** Mock grocery-scanning screen. A real build would use expo-camera here. */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.hint}>Scan a receipt or barcode</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.viewfinder}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 28 }]}>
        <TouchableOpacity
          style={styles.shutter}
          activeOpacity={0.8}
          onPress={() => router.replace('/inventory')}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <Text style={styles.caption}>Tap to capture · adds items to your inventory</Text>
      </View>
    </View>
  );
}

const FRAME = 266;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b1b1b' },
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
  caption: { fontFamily: Fonts.sans, fontSize: 12, color: '#ccc', marginTop: 14 },
});
