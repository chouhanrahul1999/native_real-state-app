import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="font-rubik text-3xl bg-red-500">Welcome to ReState</Text>
      <Link href="/sign-in">Signin</Link>
    </View>
  );
}
