import { Stack } from "expo-router";
import "./global.css"
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require('../assets/fonts/Rubik-Bold.ttf'),
    "Rubik-Regular": require('../assets/fonts/Rubik-Regular.ttf'),
  });
  return <Stack />;
}