import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
    // Read the locale from the cookie (managed by the language toggle)
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

    return {
        locale,
        // Return the messages dictionary corresponding to the locale
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
