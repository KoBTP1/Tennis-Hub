import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { colors, radius } from "../../styles/theme";

const users = [
  { name: "Alex Morgan", role: "Player", email: "alex@example.com", phone: "+1234567890", joined: "Jan 15, 2026" },
  { name: "Emily Chen", role: "Player", email: "emily@example.com", phone: "+1234567891", joined: "Feb 1, 2026" },
  { name: "John Smith", role: "Owner", email: "john@example.com", phone: "+1234567892", joined: "Nov 20, 2025" },
];

export default function AdminUsersScreen() {
  return (
    <View style={styles.root}>
      <AppHeader title="Manage Users" leftText="‹" />
      <ScreenContainer>
        <Card style={styles.searchCard}>
          <TextInput placeholder="Search by name or email..." placeholderTextColor="#9ca3af" style={styles.searchInput} />
        </Card>

        <View style={styles.roleRow}>
          {["All", "Player (2)", "Owner (3)", "Admin (1)"].map((role, index) => (
            <View key={role} style={[styles.rolePill, index === 0 ? styles.roleActive : null]}>
              <Text style={[styles.roleText, index === 0 ? styles.roleActiveText : null]}>{role}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Players</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Owners</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </Card>
        </View>

        <Text style={styles.count}>6 users found</Text>
        {users.map((user) => (
          <Card key={user.email}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.badge}>{user.role}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>{user.phone}</Text>
            <Text style={styles.meta}>Joined: {user.joined}</Text>
            <View style={styles.actionRow}>
              <View style={styles.activate}>
                <Text style={styles.activateText}>Activate</Text>
              </View>
              <View style={styles.suspend}>
                <Text style={styles.suspendText}>Suspend</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchCard: { paddingVertical: 6 },
  searchInput: { minHeight: 40, fontSize: 16 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rolePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  roleActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  roleText: { color: colors.textPrimary, fontWeight: "600" },
  roleActiveText: { color: colors.white },
  statRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 30, fontWeight: "800", color: colors.info },
  statLabel: { color: colors.textSecondary },
  count: { color: colors.textSecondary, marginTop: 4 },
  name: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.successSoft,
    color: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 3,
  },
  meta: { color: colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  activate: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.successSoft, alignItems: "center", paddingVertical: 9 },
  activateText: { color: colors.success, fontWeight: "700" },
  suspend: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, alignItems: "center", paddingVertical: 9 },
  suspendText: { color: colors.danger, fontWeight: "700" },
});
