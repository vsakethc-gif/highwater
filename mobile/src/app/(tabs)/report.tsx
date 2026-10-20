import { ComingSoon } from '../../components/ComingSoon';

/** Report tab: community reports arrive Thursday. */
export default function ReportScreen() {
  return (
    <ComingSoon
      icon="Megaphone"
      title="Report a problem"
      body="Reporting a streetlight out, a downed tree, or a flooded road is coming in a later update. The website’s report form works now. If anyone is in danger, call 911 first."
      webPath="#/report"
    />
  );
}
