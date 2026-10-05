import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, ApiError } from "@/src/api";
import { copyText, COPY_FAILED_MESSAGE } from "@/src/clipboard";
import { Button } from "@/src/components/Button";
import { TrendLine } from "@/src/components/Charts";
import { Footer } from "@/src/components/Footer";
import { Header } from "@/src/components/Header";
import { useToast } from "@/src/components/Toast";
import { buildRepMessage, openWhatsApp, TONES, Tone } from "@/src/share";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function RepScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { repCode } = useLocalSearchParams<{ repCode: string }>();
  const code = (repCode || "").toUpperCase();
  const [tone, setTone] = useState<Tone>("casual");

  const { data: config } = useQuery({ queryKey: ["config"], queryFn: api.config, staleTime: Infinity });
  const repQ = useQuery({ queryKey: ["rep", code], queryFn: () => api.rep(code), enabled: !!code, refetchInterval: 30_000, retry: (n, e) => (e as ApiError).status !== 404 && n < 2 });
  const rep = repQ.data;

  const copy = async () => {
    if (!rep) return;
    const ok = await copyText(rep.link);
    if (ok) toast.show("Link copied");
    else toast.show(COPY_FAILED_MESSAGE, "error");
  };

  const message = rep ? buildRepMessage(tone, { date: config?.workshop.datetime_label ?? "", link: rep.link, college: rep.college }) : "";

  return (
    <View style={styles.screen} testID="rep-screen">
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.container}>
          {repQ.isLoading && (
            <View style={styles.center} testID="rep-loading">
              <ActivityIndicator color={colors.onSurface} />
            </View>
          )}
          {repQ.isError && (
            <View style={styles.center} testID="rep-not-found">
              <Text style={styles.h2}>No rep with code {code}</Text>
              <Button testID="rep-go-home" title="Back to home" variant="ink" onPress={() => router.replace("/")} />
            </View>
          )}

          {rep && (
            <>
              <View style={styles.hero}>
                <View style={styles.heroTop}>
                  <Text style={styles.kicker}>Campus rep dashboard</Text>
                  {rep.is_demo && (
                    <View style={styles.demoTag} testID="rep-demo-label">
                      <Text style={styles.demoTagText}>Demo data</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.h1} testID="rep-name">
                  {rep.name}
                </Text>
                <Text style={styles.sub}>
                  {rep.college} · code <Text style={styles.mono}>{rep.rep_code}</Text>
                </Text>
              </View>

              <View style={styles.kpis}>
                <View style={[styles.kpi, styles.kpiPrimary]} testID="rep-total">
                  <Text style={[styles.kpiLabel, styles.kpiLabelOnPrimary]}>Total seats</Text>
                  <Text style={[styles.kpiValue, styles.kpiValueOnPrimary]}>{rep.total}</Text>
                </View>
                <View style={styles.kpi} testID="rep-rank">
                  <Text style={styles.kpiLabel}>Rank</Text>
                  <Text style={styles.kpiValue}>
                    #{rep.rank}
                    <Text style={styles.kpiSmall}>/{rep.rep_count}</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.kpis}>
                <View style={styles.kpi} testID="rep-direct">
                  <Text style={styles.kpiLabel}>Direct from my link</Text>
                  <Text style={styles.kpiValue}>{rep.direct}</Text>
                </View>
                <View style={styles.kpi} testID="rep-chain">
                  <Text style={styles.kpiLabel}>Via referral chain</Text>
                  <Text style={styles.kpiValue}>{rep.via_chain}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Last 14 days</Text>
                <TrendLine points={rep.trend} testID="rep-trend" />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>My link</Text>
                <Text style={styles.link} selectable testID="rep-link">
                  {rep.link}
                </Text>
                <Button testID="rep-copy-link" title="Copy my link" variant="ink" onPress={copy} icon={<Ionicons name="link-outline" size={18} color={colors.onSurfaceInverse} />} />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Ready-made WhatsApp messages</Text>
                <View style={styles.toneRow} accessibilityRole="radiogroup">
                  {TONES.map((t) => {
                    const selected = t.key === tone;
                    return (
                      <Pressable key={t.key} testID={`rep-tone-${t.key}`} accessibilityRole="radio" accessibilityState={{ selected, checked: selected }} onPress={() => setTone(t.key)} style={({ focused }: any) => [styles.tone, selected && styles.toneSelected, focused && styles.focused]}>
                        <Text style={[styles.toneText, selected && styles.toneTextSelected]}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.preview} testID="rep-message-preview">
                  <Text style={styles.previewText}>{message}</Text>
                </View>
                <Button testID="rep-whatsapp-button" title="Send on WhatsApp" onPress={() => openWhatsApp(message)} icon={<Ionicons name="logo-whatsapp" size={20} color={colors.onBrandPrimary} />} />
              </View>

              {rep.recent.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Recent seats from my network</Text>
                  {rep.recent.map((r) => (
                    <View key={r.seat_code} style={styles.recentRow}>
                      <Text style={styles.recentName}>
                        {r.name} <Text style={styles.recentMeta}>· {r.seat_code}</Text>
                      </Text>
                      <Text style={styles.recentMeta}>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          <Footer text={config?.workshop.footer} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  container: { width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing.lg },
  center: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["3xl"] },
  hero: { gap: spacing.xs },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: colors.brandPrimary },
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 32, color: colors.onSurface },
  h2: { fontFamily: fonts.bold, fontSize: 20, color: colors.onSurface, textAlign: "center" },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  mono: { fontFamily: fonts.monoBold, color: colors.onSurface },
  demoTag: { backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md },
  demoTagText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.onSurfaceTertiary },
  kpis: { flexDirection: "row", gap: spacing.md },
  kpi: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, gap: 4 },
  kpiPrimary: { backgroundColor: colors.brandSecondary },
  kpiLabel: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: colors.muted },
  kpiLabelOnPrimary: { color: colors.onBrandSecondary },
  kpiValue: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 36, color: colors.onSurfaceSecondary },
  kpiValueOnPrimary: { color: colors.onBrandSecondary },
  kpiSmall: { fontFamily: fonts.medium, fontSize: 16, color: colors.muted },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  cardTitle: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted },
  link: { fontFamily: fonts.mono, fontSize: 13, color: colors.onSurfaceSecondary },
  toneRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  tone: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.borderStrong, justifyContent: "center" },
  toneSelected: { backgroundColor: colors.brandSecondary, borderColor: colors.border },
  toneText: { fontFamily: fonts.medium, fontSize: 13, color: colors.onSurfaceSecondary },
  toneTextSelected: { color: colors.onBrandSecondary },
  focused: { outlineStyle: "solid", outlineWidth: 3, outlineColor: colors.focus, outlineOffset: 2 } as any,
  preview: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  previewText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.onSurfaceSecondary },
  recentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.divider },
  recentName: { fontFamily: fonts.medium, fontSize: 14, color: colors.onSurfaceSecondary, flex: 1 },
  recentMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
}));
