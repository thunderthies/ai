import Ionicons from "@react-native-vector-icons/ionicons";
import { Link, usePathname } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSchemeToggle } from "@/src/scheme";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function Header() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { scheme, toggle } = useSchemeToggle();

  const links: { href: "/" | "/board"; label: string; testID: string }[] = [
    { href: "/", label: "Ticket", testID: "nav-home" },
    { href: "/board", label: "Board", testID: "nav-board" },
  ];

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]} testID="app-header">
      <Link href="/" asChild>
        <Pressable testID="brand-link" accessibilityRole="link" accessibilityLabel="Your Hall Ticket, home" style={({ focused }: any) => [styles.brand, focused && styles.focused]}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>NW</Text>
          </View>
          <Text style={styles.brandText}>Your Hall Ticket</Text>
        </Pressable>
      </Link>
      <View style={styles.right}>
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} asChild>
              <Pressable
                testID={l.testID}
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                style={({ focused }: any) => [styles.navItem, active && styles.navActive, focused && styles.focused]}
              >
                <Text style={[styles.navText, active && styles.navTextActive]}>{l.label}</Text>
              </Pressable>
            </Link>
          );
        })}
        <Pressable
          testID="theme-toggle"
          accessibilityRole="button"
          accessibilityLabel={scheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onPress={toggle}
          style={({ focused }: any) => [styles.iconBtn, focused && styles.focused]}
        >
          <Ionicons name={scheme === "dark" ? "sunny-outline" : "moon-outline"} size={20} color={colors.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44, flexShrink: 1 },
  brandMark: { backgroundColor: colors.brandPrimary, paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.md },
  brandMarkText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.onBrandPrimary, letterSpacing: 1 },
  brandText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface, flexShrink: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  navItem: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: "center", borderRadius: radius.md, borderBottomWidth: 3, borderBottomColor: "transparent" },
  navActive: { borderBottomColor: colors.brandPrimary },
  navText: { fontFamily: fonts.bold, fontSize: 14, color: colors.onSurface },
  navTextActive: { color: colors.brandPrimary },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 2, borderColor: colors.borderStrong },
  focused: { outlineStyle: "solid", outlineWidth: 3, outlineColor: colors.focus, outlineOffset: 2 } as any,
}));
