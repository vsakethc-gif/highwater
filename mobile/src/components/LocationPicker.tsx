/**
 * LocationPicker.tsx — choose a place: one of the 8 counties, your current location, or a ZIP code.
 *
 * "Use my location" asks the phone for GPS (expo-location). The coordinates stay on the phone:
 * they're used to find the county and sent only to the public services that answer for that
 * spot (NWS rain forecast, FEMA flood zone). They're never saved.
 */
import * as Location from 'expo-location';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COUNTIES } from '../../../shared/config';
import { placeFromPoint, placeFromZip } from '../../../shared/places';
import { useAppState } from '../state';
import { fadeIn, font, radius, space, spring, tapTarget, text, useTheme } from '../theme';
import { Icon } from './Icon';
import { Button, Txt } from './ui';

function CountyChip({ name, selected, onPress }: { name: string; selected: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.95, spring.snappy))}
        onPressOut={() => (scale.value = withSpring(1, spring.snappy))}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${name} County`}
        style={[s.chip, { borderColor: selected ? c.accent : c.borderStrong, backgroundColor: selected ? c.accent : c.surface }]}
      >
        <Txt style={{ fontFamily: font.semibold, color: selected ? c.onAccent : c.ink }}>{name}</Txt>
      </Pressable>
    </Animated.View>
  );
}

export function LocationPicker() {
  const { c } = useTheme();
  const { place, setPlace } = useAppState();
  const [zip, setZip] = useState('');
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  // Keep the chosen county's chip in view (York is last in the row).
  const row = useRef<ComponentRef<typeof ScrollView>>(null);
  const chipX = useRef<Record<string, number>>({});
  useEffect(() => {
    const x = chipX.current[place.fips];
    if (x !== undefined) row.current?.scrollTo({ x: Math.max(0, x - space[2]), animated: true });
  }, [place.fips]);

  async function useMyLocation() {
    setMessage('Finding your location…');
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setMessage('Location permission was turned down. You can choose a county or enter a ZIP code instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await placeFromPoint(pos.coords.latitude, pos.coords.longitude, 'Your location');
      if (typeof result === 'string') setMessage(result);
      else {
        setMessage('');
        setPlace(result);
      }
    } catch {
      setMessage('Couldn’t get your location. Choose a county or enter a ZIP code.');
    } finally {
      setLocating(false);
    }
  }

  async function findZip() {
    const result = await placeFromZip(zip);
    if (typeof result === 'string') setMessage(result);
    else {
      setMessage('');
      setPlace(result);
    }
  }

  return (
    <View style={{ gap: space[2] }}>
      <ScrollView ref={row} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[1], paddingRight: space[2] }} accessibilityRole="radiogroup" accessibilityLabel="County">
        {COUNTIES.map((county) => (
          <View
            key={county.fips}
            onLayout={(e) => {
              chipX.current[county.fips] = e.nativeEvent.layout.x;
              if (county.fips === place.fips) row.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - space[2]), animated: false });
            }}
          >
            <CountyChip name={county.name} selected={place.kind === 'county' && place.fips === county.fips} onPress={() => setPlace({ kind: 'county', fips: county.fips })} />
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space[1] }}>
        <Button label={locating ? 'Locating…' : 'Use my location'} icon="LocateFixed" onPress={useMyLocation} disabled={locating} style={{ flex: 1 }} />
        <View style={[s.zip, { borderColor: c.borderStrong, backgroundColor: c.surface }]}>
          <TextInput
            value={zip}
            onChangeText={(t) => setZip(t.replace(/\D/g, '').slice(0, 5))}
            onSubmitEditing={findZip}
            placeholder="ZIP"
            placeholderTextColor={c.inkSubtle}
            keyboardType="number-pad"
            returnKeyType="search"
            maxLength={5}
            accessibilityLabel="ZIP code"
            style={[s.zipInput, { color: c.ink }]}
          />
          <Pressable onPress={findZip} accessibilityRole="button" accessibilityLabel="Find ZIP code" style={s.zipGo} hitSlop={6}>
            <Icon name="Search" />
          </Pressable>
        </View>
      </View>
      {message ? (
        <Animated.View entering={fadeIn} accessibilityLiveRegion="polite">
          <Txt variant="meta">{message}</Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  chip: { minHeight: tapTarget, paddingHorizontal: space[2], borderWidth: 1, borderRadius: 999, justifyContent: 'center' },
  zip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, paddingLeft: space[1], width: 128 },
  zipInput: { flex: 1, minHeight: tapTarget, fontFamily: font.regular, fontSize: text.md },
  zipGo: { width: tapTarget, height: tapTarget, alignItems: 'center', justifyContent: 'center' },
});
