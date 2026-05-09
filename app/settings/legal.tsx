import { Link, useLocalSearchParams } from 'expo-router';
import { type JSX, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { PRIVACY_MD } from '@/legal/privacy';
import { TERMS_MD } from '@/legal/terms';
import { CREAM, MUTED_TEXT } from '@/theme/colors';

type Tab = 'privacy' | 'terms';

const MARKDOWN_STYLES = {
  body: {
    color: '#0F172A',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 6,
  },
  heading3: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 15,
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 4,
  },
  strong: { fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  em: { fontStyle: 'italic' as const },
  link: { color: '#0B6B3A' },
  bullet_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  paragraph: { marginVertical: 6 },
  hr: {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    height: 1,
    marginVertical: 16,
  },
  table: { borderWidth: 0 },
  thead: { backgroundColor: 'rgba(15, 23, 42, 0.03)' },
  th: {
    fontFamily: 'Inter_600SemiBold',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(15, 23, 42, 0.12)',
  },
  td: {
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(15, 23, 42, 0.06)',
  },
  code_inline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
};

export default function LegalScreen(): JSX.Element {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: Tab = params.tab === 'terms' ? 'terms' : 'privacy';
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CREAM }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 8,
        }}
      >
        <Link
          href="/settings"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: MUTED_TEXT }}
        >
          ← Settings
        </Link>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 13,
            letterSpacing: 0.6,
            color: MUTED_TEXT,
            textTransform: 'uppercase',
          }}
        >
          Legal
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 12 }}>
        <SegmentedControl<Tab>
          options={[
            { value: 'privacy', label: 'Privacy' },
            { value: 'terms', label: 'Terms' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Markdown style={MARKDOWN_STYLES}>
          {tab === 'privacy' ? PRIVACY_MD : TERMS_MD}
        </Markdown>
      </ScrollView>
    </SafeAreaView>
  );
}
