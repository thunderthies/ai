import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Ticket, Workshop } from "@/src/api";
import { copyText, COPY_FAILED_MESSAGE } from "@/src/clipboard";
import { Button } from "@/src/components/Button";
import { downloadStory } from "@/src/download";
import { buildMessage, openWhatsApp, TONES, Tone } from "@/src/share";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { track } from "@/src/track";

type Props = {
  ticket: Ticket;
  workshop?: Workshop;
  onToast: (msg: string, kind?: "info" | "error") => void;
};

export function ShareSheet({ ticket, workshop, onToast }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [tone, setTone] = useState<Tone>("casual");
  const [downloading, setDownloading] = useState(false);

  const message = buildMessage(tone, {
    name: ticket.name,
    date: workshop?.datetime_label ?? "",
    link: ticket.ref_link,
    project: ticket.project.title,
  });

  const copyLink = async () => {
    const ok = await copyText(ticket.ref_link);
    if (ok) onToast("Link copied");
    else onToast(COPY_FAILED_MESSAGE, "error");
  };

  const copyMessage = async () => {
    const ok = await copyText(message);
    if (ok) {
      track("message_copied", { path: "/ticket", seat_code: ticket.seat_code, tone });
      onToast("Message copied");
    } else onToast(COPY_FAILED_MESSAGE, "error");
  };

  const download = async () => {
    setDownloading(true);
    try {
      const r = await downloadStory(ticket.story_url, ticket.seat_code);
      onToast(r === "downloaded" ? "Ticket image downloading (1080×1920)" : "Ticket image ready to save");
    } catch {
      onToast("Could not download. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.wrap} testID="share-sheet">
      <Text style={styles.heading}>Spread the word</Text>
      <Text style={styles.sub}>Every friend who registers with your link counts for your campus bar.</Text>

      <View style={styles.toneRow} accessibilityRole="radiogroup" accessibilityLabel="Message tone">
        {TONES.map((t) => {
          const selected = t.key === tone;
          return (
            <Pressable
              key={t.key}
              testID={`tone-${t.key}`}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              onPress={() => setTone(t.key)}
              style={({ focused }: any) => [styles.tone, selected && styles.toneSelected, focused && styles.focused]}
            >
              <Text style={[styles.toneText, selected && styles.toneTextSelected]} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.preview} testID="share-message-preview">
        <Text style={styles.previewText} selectable>
          {message}
        </Text>
      </View>

      <Button
        testID="share-whatsapp-button"
        title="Send to my batch on WhatsApp"
        onPress={() => {
          track("share_clicked", { path: "/ticket", seat_code: ticket.seat_code, tone });
          openWhatsApp(message);
        }}
        variant="ink"
        icon={<Ionicons name="logo-whatsapp" size={20} color={colors.onSurfaceInverse} />}
      />
      <View style={styles.row}>
        <Button
          testID="download-ticket-button"
          title="Download as image"
          onPress={download}
          loading={downloading}
          variant="outline"
          style={{ flex: 1 }}
          icon={<Ionicons name="download-outline" size={18} color={colors.onSurface} />}
        />
        <Button
          testID="copy-link-button"
          title="Copy link"
          onPress={copyLink}
          variant="outline"
          icon={<Ionicons name="link-outline" size={18} color={colors.onSurface} />}
        />
      </View>
      <Button
        testID="copy-message-button"
        title="Copy message"
        onPress={copyMessage}
        variant="outline"
        icon={<Ionicons name="copy-outline" size={18} color={colors.onSurface} />}
      />
      <Text style={styles.refLink} testID="ref-link" selectable>
        {ticket.ref_link}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.md },
  heading: { fontFamily: fonts.bold, fontSize: 20, color: colors.onSurface },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 19 },
  toneRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  tone: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
  },
  toneSelected: { backgroundColor: colors.brandSecondary, borderColor: colors.border },
  toneText: { fontFamily: fonts.medium, fontSize: 13, color: colors.onSurfaceSecondary },
  toneTextSelected: { color: colors.onBrandSecondary },
  focused: { outlineStyle: "solid", outlineWidth: 3, outlineColor: colors.focus, outlineOffset: 2 } as any,
  preview: { borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary },
  previewText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.onSurfaceSecondary },
  row: { flexDirection: "row", gap: spacing.sm },
  refLink: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
}));
