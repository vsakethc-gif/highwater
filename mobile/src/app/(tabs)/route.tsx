import { ComingSoon } from '../../components/ComingSoon';

/** Route tab: the lower-exposure route planner arrives Wednesday. */
export default function RouteScreen() {
  return (
    <ComingSoon
      icon="Signpost"
      title="Route"
      body="Planning a way out that avoids active warning areas is coming in a later update. The website’s route planner works now. Routes can’t see every closed or flooded road: never drive through water, and follow officials’ directions."
      webPath="#/route"
    />
  );
}
