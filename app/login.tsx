import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/wordmark';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useAuth } from '@/store/auth-store';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !busy;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error } = isSignup
      ? await signUp(email, password)
      : await signIn(email, password);
    setBusy(false);
    if (error) {
      setError(error);
    } else if (isSignup) {
      // If email confirmation is on, there's no session yet — tell the user.
      // If it's off, the auth listener will redirect away from this screen.
      setNotice('Account created. If sign-in doesn’t continue, check your email to confirm.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <View style={styles.brand}>
          <Wordmark />
          <View style={styles.rule} />
        </View>

        <Text style={styles.heading}>
          {isSignup ? 'Create your kitchen' : 'Welcome back'}
        </Text>
        <Text style={styles.sub}>
          {isSignup
            ? 'Sign up to track your inventory and recipes.'
            : 'Sign in to your virtual kitchen.'}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="at least 6 characters"
            placeholderTextColor={Colors.muted}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonOff]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={onSubmit}>
          {busy ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>
              {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggle}
          onPress={() => {
            setMode(isSignup ? 'signin' : 'signup');
            setError(null);
            setNotice(null);
          }}>
          <Text style={styles.toggleText}>
            {isSignup
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 28 },
  brand: { alignItems: 'center', marginBottom: 40 },
  rule: { height: 1, backgroundColor: Colors.text, alignSelf: 'stretch', marginTop: 8, marginHorizontal: 40 },
  heading: { fontFamily: Fonts.serif, fontSize: 30, color: Colors.text, textAlign: 'center' },
  sub: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
  label: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.muted, marginBottom: 6 },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.field,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    height: 46,
  },
  error: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.danger, marginBottom: 8 },
  notice: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.greenText, marginBottom: 8 },
  button: {
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonOff: { opacity: 0.5 },
  buttonText: { fontFamily: Fonts.sansMedium, fontSize: 16, color: Colors.text, letterSpacing: 0.5 },
  toggle: { alignItems: 'center', marginTop: 22 },
  toggleText: { fontFamily: Fonts.serifItalic, fontSize: 14, color: Colors.text },
});
