import { ComingSoon } from '../../components/ComingSoon';

/** Map tab: the native district map arrives in the next build (Tuesday). */
export default function MapScreen() {
  return (
    <ComingSoon
      icon="Map"
      title="Map"
      body="The native map of all 8 counties, with river gauges, warning areas, and who lives where, is coming in the next update. The website’s map works now."
      webPath="#/map"
    />
  );
}
