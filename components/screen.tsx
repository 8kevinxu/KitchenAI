import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { goBack } from '@/lib/nav';
import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { USER } from '@/data/kitchen';
import { Wordmark } from '@/components/wordmark';

type Props = {
  children: ReactNode;
  /** Show the back chevron on the left of the header. */
  showBack?: boolean;
  /** Show the user-circle button on the right of the header. */
  showProfile?: boolean;
  /** Render content in a ScrollView (default) or a plain padded View. */
  scroll?: boolean;
  /** Background color for the whole screen. */
  background?: string;
  /** Hide the footer support line. */
  hideFooter?: boolean;
  contentStyle?: object;
};

export function Screen({
  children,
  showBack = false,
  showProfile = true,
  scroll = true,
  background = Colors.background,
  hideFooter = false,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: [styles.scrollContent, contentStyle],
        showsVerticalScrollIndicator: false,
      }
    : { style: [styles.viewContent, contentStyle] };

  return (
    <View style={[styles.root, { backgroundColor: background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {showBack && (
            <TouchableOpacity onPress={goBack} hitSlop={12} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={26} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerCenter}>
          <Wordmark />
          <View style={styles.rule} />
        </View>

        <View style={[styles.headerSide, styles.headerSideRight]}>
          {showProfile && (
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              hitSlop={12}
              accessibilityLabel="Profile">
              <Ionicons name="person-circle-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Body {...(bodyProps as any)}>
        {children}
        {!hideFooter && (
          <Text style={styles.footer}>Questions? {USER.email}</Text>
        )}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 18,
    paddingBottom: 8,
  },
  headerSide: { width: 40, justifyContent: 'center', paddingTop: 6 },
  headerSideRight: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  rule: {
    height: 1,
    backgroundColor: Colors.hairline,
    alignSelf: 'stretch',
    marginTop: 8,
    marginHorizontal: 8,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 40,
    flexGrow: 1,
  },
  viewContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenX,
  },
  footer: {
    fontFamily: Fonts.serif,
    fontSize: 10,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: 32,
  },
});
