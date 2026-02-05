import { Account, Avatars, Client, OAuthProvider } from "react-native-appwrite";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { response } from "express";

export const config = {
  Platform: "com.rahul.Restate",
  endpoint: process.env.VITE_APPWRITE_ENDPOINT!,
  project: process.env.VITE_APPWRITE_PROJECT!,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.project!)
  .setPlatform(config.Platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);

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

export async function getUser() {
  try {
    const user = await account.get();

    if (user.$id) {
      const userAvatar = avatar.getInitials(user.name);

      return {
        ...response,
        avatar: userAvatar.toString(),
      };
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
