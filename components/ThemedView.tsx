import { View, type ViewProps, useColorScheme } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? (darkColor ?? '#1D3D47') : (lightColor ?? '#A1CEDC');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
