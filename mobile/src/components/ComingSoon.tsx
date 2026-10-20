/**
 * ComingSoon.tsx — an honest placeholder for a tab that's still being built.
 * It says when it's coming and links to the website version, which already works.
 */
import { Linking, ScrollView, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Button, Screen, Txt } from './ui';
import { radius, space, useTheme } from '../theme';

export function ComingSoon({ icon, title, body, webPath }: { icon: IconName; title: string; body: string; webPath: string }) {
  const { c } = useTheme();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space[3], paddingTop: space[5], gap: space[3], paddingBottom: 120 }}>
        <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={30} tint={c.accent} />
        </View>
        <Txt variant="serifTitle" accessibilityRole="header">
          {title}
        </Txt>
        <Txt style={{ color: c.inkMuted }}>{body}</Txt>
        <Button label="Open it on the website" icon="ExternalLink" onPress={() => Linking.openURL(`https://vsakethc-gif.github.io/highwater/${webPath}`)} />
      </ScrollView>
    </Screen>
  );
}
