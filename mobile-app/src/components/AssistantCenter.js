import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { askAssistant } from "../services/assistantService";
import { radius } from "../styles/theme";

function buildWelcomeMessage(t) {
  return {
    id: "welcome",
    role: "assistant",
    text: t("assistantWelcome"),
  };
}

function buildDefaultSuggestions(t) {
  return [t("assistantQuickBooking"), t("assistantQuickSlots"), t("assistantQuickCancel")];
}

export default function AssistantCenter({ visible, onClose }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => [buildWelcomeMessage(t)]);
  const [quickSuggestions, setQuickSuggestions] = useState(() => buildDefaultSuggestions(t));
  const [lastFailedMessage, setLastFailedMessage] = useState("");
  const scrollRef = useRef(null);

  const canSend = useMemo(() => String(input || "").trim().length > 0 && !isSending, [input, isSending]);
  const assistantBubbleBackground = theme.mode === "dark" ? "#1f2937" : "#f1f5f9";
  const suggestionChipBackground = theme.mode === "dark" ? "#0f172a" : "#f8fafc";
  const canRetry = String(lastFailedMessage || "").trim().length > 0 && !isSending;

  useEffect(() => {
    setQuickSuggestions(buildDefaultSuggestions(t));
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "welcome") {
        return [buildWelcomeMessage(t)];
      }
      return prev;
    });
  }, [t]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    });
  };

  const pushMessage = (message) => {
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  };

  const handleSend = async (presetText = "") => {
    const content = String(presetText || input || "").trim();
    if (!content || isSending) {
      return;
    }

    const nextHistory = messages
      .filter((item) => item.id !== "welcome")
      .slice(-8)
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        text: item.text,
      }));

    pushMessage({
      id: `u-${Date.now()}`,
      role: "user",
      text: content,
    });
    setInput("");
    setIsSending(true);
    setLastFailedMessage("");

    try {
      const response = await askAssistant(content, nextHistory, language);
      const answer = String(response?.data?.answer || "").trim();
      if (!answer) {
        throw {
          message: t("assistantDefaultError"),
          retryable: true,
        };
      }
      const suggestions = Array.isArray(response?.data?.suggestions) ? response.data.suggestions : [];
      pushMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        text: answer,
      });
      if (suggestions.length > 0) {
        setQuickSuggestions(suggestions.slice(0, 3));
      }
    } catch (error) {
      const errorText = String(error?.message || t("assistantDefaultError")).trim() || t("assistantDefaultError");
      pushMessage({
        id: `e-${Date.now()}`,
        role: "assistant",
        text: errorText,
      });
      if (error?.retryable !== false) {
        setLastFailedMessage(content);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="sparkles-outline" size={18} color={theme.info} />
              <Text style={[styles.title, { color: theme.text }]}>{t("assistantTitle")}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={scrollRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.assistantBubble,
                  {
                    backgroundColor: item.role === "user" ? theme.info : assistantBubbleBackground,
                  },
                ]}
              >
                <Text style={[styles.bubbleText, { color: item.role === "user" ? "#fff" : theme.text }]}>
                  {item.text}
                </Text>
              </View>
            ))}
            {isSending ? (
              <View style={styles.typingWrap}>
                <ActivityIndicator size="small" color={theme.info} style={styles.typing} />
                <Text style={[styles.typingText, { color: theme.textSecondary }]}>{t("assistantSending")}</Text>
              </View>
            ) : null}
          </ScrollView>

          {quickSuggestions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionRow}>
              {quickSuggestions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.suggestionChip, { borderColor: theme.border, backgroundColor: suggestionChipBackground }]}
                  onPress={() => {
                    void handleSend(item);
                  }}
                >
                  <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          {lastFailedMessage ? (
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: theme.border }]}
              disabled={!canRetry}
              onPress={() => {
                if (!canRetry) {
                  pushMessage({
                    id: `e-retry-${Date.now()}`,
                    role: "assistant",
                    text: t("assistantRetryNotAvailable"),
                  });
                  return;
                }
                void handleSend(lastFailedMessage);
              }}
            >
              <Ionicons name="refresh-outline" size={14} color={theme.info} />
              <Text style={[styles.retryText, { color: canRetry ? theme.info : theme.textSecondary }]}>
                {t("assistantRetryLastQuestion")}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t("assistantInputPlaceholder")}
              placeholderTextColor="#94a3b8"
              style={[styles.input, { color: theme.text }]}
              multiline
              maxLength={600}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: canSend ? theme.info : "#94a3b8" }]}
              disabled={!canSend}
              onPress={() => {
                void handleSend();
              }}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 12,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: "84%",
    minHeight: "58%",
    padding: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 16, fontWeight: "800" },
  list: { flex: 1 },
  listContent: { paddingBottom: 10 },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  typingWrap: { flexDirection: "row", alignItems: "center", marginVertical: 6, gap: 6 },
  typing: { marginVertical: 6 },
  typingText: { fontSize: 12, fontWeight: "600" },
  suggestionRow: { marginBottom: 8, maxHeight: 40 },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestionText: { fontSize: 12, fontWeight: "600" },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  retryText: { fontSize: 12, fontWeight: "700" },
  inputRow: {
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  input: { flex: 1, minHeight: 36, maxHeight: 90, fontSize: 14, paddingTop: 0, paddingBottom: 0 },
  sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
