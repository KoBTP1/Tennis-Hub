import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { askAssistant } from "../services/assistantService";
import { radius } from "../styles/theme";

function buildWelcomeMessage() {
  return {
    id: "welcome",
    role: "assistant",
    text: "Xin chao, minh la TennisHub Assistant. Ban can ho tro dat san, gia, slot trong, huy lich hay map?",
  };
}

export default function AssistantCenter({ visible, onClose }) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([buildWelcomeMessage()]);
  const [quickSuggestions, setQuickSuggestions] = useState([
    "Lam sao dat san?",
    "Toi muon xem slot trong hom nay",
    "Lam sao huy booking?",
  ]);
  const scrollRef = useRef(null);

  const canSend = useMemo(() => String(input || "").trim().length > 0 && !isSending, [input, isSending]);
  const assistantBubbleBackground = theme.mode === "dark" ? "#1f2937" : "#f1f5f9";
  const suggestionChipBackground = theme.mode === "dark" ? "#0f172a" : "#f8fafc";

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

    pushMessage({
      id: `u-${Date.now()}`,
      role: "user",
      text: content,
    });
    setInput("");
    setIsSending(true);

    try {
      const historyPayload = messages
        .filter((item) => item.id !== "welcome")
        .slice(-8)
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          text: item.text,
        }));
      const response = await askAssistant(content, historyPayload);
      const answer = String(response?.data?.answer || "").trim() || "Xin loi, hien tai minh chua tra loi duoc.";
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
      pushMessage({
        id: `e-${Date.now()}`,
        role: "assistant",
        text: error?.response?.data?.message || "Khong the ket noi tro ly luc nay. Vui long thu lai.",
      });
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
              <Text style={[styles.title, { color: theme.text }]}>TennisHub Assistant</Text>
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
            {isSending ? <ActivityIndicator size="small" color={theme.info} style={styles.typing} /> : null}
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

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nhap cau hoi..."
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
  typing: { marginVertical: 6 },
  suggestionRow: { marginBottom: 8, maxHeight: 40 },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestionText: { fontSize: 12, fontWeight: "600" },
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
