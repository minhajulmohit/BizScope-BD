import { cookies } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_COOKIE,
  type Language,
} from "@/lib/i18n";

export async function getLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LANGUAGE_COOKIE)?.value;
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}
