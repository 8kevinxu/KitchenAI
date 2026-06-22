import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

/** The "virtual kitchen" serif wordmark used in every header. */
export function Wordmark() {
  return (
    <Text style={styles.text}>
      <Text style={styles.regular}>virtual </Text>
      <Text style={styles.italic}>kitchen</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 20, color: Colors.text },
  regular: { fontFamily: Fonts.serif },
  italic: { fontFamily: Fonts.serifItalic },
});
