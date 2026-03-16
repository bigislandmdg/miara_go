import * as React from "react";
import { View, Text, StyleSheet, ScrollView, ViewStyle, StyleProp } from "react-native";
import Svg, { Circle, Rect, Line } from "react-native-svg";

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<any>;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a ChartContainer");
  return context;
}

interface ChartContainerProps {
  config: ChartConfig;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ChartContainer({ config, children, style }: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <View style={[styles.container, style]}>{children}</View>
    </ChartContext.Provider>
  );
}

// Tooltip React Native
interface ChartTooltipContentProps {
  payload?: { value: number; dataKey?: string; name?: string; color?: string }[];
  label?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  style?: StyleProp<ViewStyle>;
}

export function ChartTooltipContent({
  payload,
  label,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
  style,
}: ChartTooltipContentProps) {
  const { config } = useChart();
  if (!payload || !payload.length) return null;

  return (
    <View style={[styles.tooltip, style]}>
      {!hideLabel && label && <Text style={styles.tooltipLabel}>{label}</Text>}
      {payload.map((item, index) => {
        const key = item.dataKey || item.name || `value-${index}`;
        const itemConfig = config[key];

        const color = item.color || itemConfig?.color || "#000";
        const Icon = itemConfig?.icon;

        return (
          <View key={index} style={styles.tooltipItem}>
            {!hideIndicator &&
              (Icon ? (
                <Icon />
              ) : indicator === "dot" ? (
                <View style={[styles.dot, { backgroundColor: color }]} />
              ) : indicator === "line" ? (
                <Svg height={4} width={20}>
                  <Line x1={0} y1={2} x2={20} y2={2} stroke={color} strokeWidth={2} />
                </Svg>
              ) : (
                <View
                  style={[
                    styles.dashedLine,
                    { borderColor: color, borderStyle: "dashed" },
                  ]}
                />
              ))}
            <Text style={styles.tooltipText}>{itemConfig?.label || item.name}</Text>
            <Text style={styles.tooltipValue}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Legend React Native
interface ChartLegendProps {
  payload?: { value: any; dataKey?: string; name?: string; color?: string }[];
  hideIcon?: boolean;
  verticalAlign?: "top" | "bottom";
  style?: StyleProp<ViewStyle>;
}

export function ChartLegendContent({ payload, hideIcon = false, verticalAlign = "bottom", style }: ChartLegendProps) {
  const { config } = useChart();
  if (!payload || !payload.length) return null;

  return (
    <View style={[styles.legendContainer, verticalAlign === "top" ? { paddingBottom: 8 } : { paddingTop: 8 }, style]}>
      {payload.map((item, index) => {
        const key = item.dataKey || item.name || `value-${index}`;
        const itemConfig = config[key];
        const color = item.color || itemConfig?.color || "#000";
        const Icon = itemConfig?.icon;

        return (
          <View key={index} style={styles.legendItem}>
            {!hideIcon &&
              (Icon ? <Icon /> : <View style={[styles.legendDot, { backgroundColor: color }]} />)}
            {itemConfig?.label || item.name}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    justifyContent: "center",
    alignItems: "center",
  },
  tooltip: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 120,
  },
  tooltipLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },
  tooltipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    justifyContent: "space-between",
  },
  tooltipText: {
    flex: 1,
    color: "#6b7280",
  },
  tooltipValue: {
    fontFamily: "monospace",
    fontWeight: "600",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  dashedLine: {
    width: 20,
    borderTopWidth: 2,
    marginRight: 4,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
