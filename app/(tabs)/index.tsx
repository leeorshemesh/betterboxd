import { Redirect } from 'expo-router';

/** Default tab entry → Feed */
export default function TabsIndex() {
  return <Redirect href="/feed" />;
}
