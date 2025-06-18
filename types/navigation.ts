import { Session } from "@supabase/supabase-js";

export type RootStackParamList = {
  Auth: undefined;
  Feeds: undefined;
  Profile: { session: Session };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
