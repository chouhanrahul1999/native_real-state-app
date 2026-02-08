import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  Account,
  Avatars,
  Client,
  Databases,
  OAuthProvider,
  Query,
} from "react-native-appwrite";

export const config = {
  Platform: "com.rahul.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  project: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
  galleriesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID!,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID!,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID!,
  propertiesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID!,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.project!)
  .setPlatform(config.Platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const database = new Databases(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri,
    );

    if (!response) throw new Error("Failes to login");

    const browserResult = await WebBrowser.openAuthSessionAsync(
      response.toString(),
      redirectUri,
    );

    if (browserResult.type !== "success")
      throw new Error("Failed to open browser");

    const url = new URL(browserResult.url);

    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();

    if (!secret || !userId)
      throw new Error("Invalid response from OAuth provider");

    const session = await account.createSession(userId, secret);

    if (!session) throw new Error("Failed to create session");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const user = await account.get();

    if (user.$id) {
      return {
        ...user,
        avatar: null,
      };
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getLatestProperties() {
  try {
    const result = await database.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)],
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query?: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All") {
      buildQuery.push(Query.equal("properties", filter));
    }

    if (query) {
      buildQuery.push(Query.contains("name", query));
    }

    if (limit) buildQuery.push(Query.limit(limit));

    const result = await database.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery,
    );

    return result.documents;
  } catch (error) {
    console.error("getProperties error:", error);
    return [];
  }
}

export async function getPropertyById({ id }: { id: string }) {
  try {
    const result = await database.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      id,
    );
    // Also fetch reviews associated with this property
    try {
      const reviewsResult = await database.listDocuments(
        config.databaseId!,
        config.reviewsCollectionId!,
        [Query.equal("property", id), Query.orderDesc("$createdAt")],
      );

      const galleriesResult = await database.listDocuments(
        config.databaseId!,
        config.galleriesCollectionId!,
        [Query.equal("property", id), Query.orderDesc("$createdAt")],
      );

      return {
        ...result,
        reviews: reviewsResult?.documents || [],
        gallery: galleriesResult?.documents || [],
      };
    } catch (err: any) {
      // If the collection doesn't have the queried attribute (e.g. `property`),
      // Appwrite will throw. This is expected in some setups — log concisely
      // and fall back to client-side filtering instead of spamming a stack trace.
      const isMissingAttributeError =
        err?.response?.type === "general_query_invalid" ||
        (typeof err?.message === "string" &&
          err.message.includes("Attribute not found"));

      if (isMissingAttributeError) {
        console.warn(
          "Appwrite: collection schema missing attribute 'property' - falling back to client-side filtering",
        );
      } else {
        console.error("Error fetching related documents:", err);
        console.error("Error message:", err?.message);
        console.error("Error code:", err?.code);
        console.error("Error response:", err?.response);
      }

      try {
        // Try to retrieve a reasonable page of reviews and filter by property id
        const allReviews = await database.listDocuments(
          config.databaseId!,
          config.reviewsCollectionId!,
          [Query.limit(1000)],
        );

        const filteredReviews = (allReviews?.documents || []).filter(
          (d: any) =>
            d.property === id || d.property === id || d.property === id,
        );

        // Galleries in this project are not necessarily linked to a property in schema.
        // Prefer any gallery already present on the property document, otherwise return empty.
        const fallbackGallery = (result as any).gallery || [];

        return {
          ...result,
          reviews: filteredReviews,
          gallery: fallbackGallery,
        };
      } catch (fallbackErr) {
        console.error(
          "Fallback fetching related documents failed:",
          fallbackErr,
        );
        return result;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getAgentById({ id }: { id: string }) {
  try {
    const result = await database.getDocument(
      config.databaseId!,
      config.agentsCollectionId!,
      id,
    );
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}
