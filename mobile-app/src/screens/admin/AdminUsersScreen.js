import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminUsers, updateAdminUserStatus } from "../../services/adminService";
import { colors, radius } from "../../styles/theme";

const DEFAULT_STATS = {
  totalUsers: 0,
  byRole: { player: 0, owner: 0, admin: 0 },
  byStatus: { active: 0, blocked: 0 },
};

export default function AdminUsersScreen({ onNavigate }) {
  const { token, user: currentUser } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const loadUsers = useCallback(
    async (keywordOverride = "") => {
      if (!token) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await getAdminUsers({
          token,
          keyword: keywordOverride,
          role: selectedRole,
          status: "all",
          page: 1,
          limit: 50,
        });
        setUsers(response.data || []);
        setStats(response.stats || DEFAULT_STATS);
        setTotalUsers(response.pagination?.total || 0);
      } catch (error) {
        Alert.alert("Load users failed", error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [token, selectedRole]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(searchKeyword.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers, searchKeyword]);

  const roleFilters = useMemo(
    () => [
      { key: "all", label: `All (${stats.totalUsers})` },
      { key: "player", label: `Player (${stats.byRole.player || 0})` },
      { key: "owner", label: `Owner (${stats.byRole.owner || 0})` },
      { key: "admin", label: `Admin (${stats.byRole.admin || 0})` },
    ],
    [stats]
  );

  const handleUpdateStatus = async (targetUser, status) => {
    if (!token || isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateAdminUserStatus({
        token,
        userId: targetUser.mongoId || targetUser.id,
        status,
      });
      await loadUsers(searchKeyword.trim());
      Alert.alert("Success", `User ${targetUser.name} is now ${status}.`);
    } catch (error) {
      Alert.alert("Update failed", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (input) => {
    if (!input) {
      return "-";
    }

    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader title="Manage Users" leftText="‹" onLeftPress={() => onNavigate?.("dashboard")} />
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer>
          <Card style={styles.searchCard}>
            <TextInput
              placeholder="Search by name or email..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
          </Card>

        <View style={styles.roleRow}>
          {roleFilters.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[styles.rolePill, selectedRole === role.key ? styles.roleActive : null]}
              onPress={() => setSelectedRole(role.key)}
            >
              <Text style={[styles.roleText, selectedRole === role.key ? styles.roleActiveText : null]}>{role.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.byRole.player || 0}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.byRole.owner || 0}</Text>
            <Text style={styles.statLabel}>Owners</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.byRole.admin || 0}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </Card>
        </View>

        <Text style={styles.count}>{totalUsers} users found</Text>
        {isLoading ? <ActivityIndicator size="large" color={colors.info} style={styles.loader} /> : null}
        {!isLoading && users.length === 0 ? <Text style={styles.empty}>No users found.</Text> : null}
          {!isLoading &&
            users.map((user) => {
              const isBlocked = user.status === "blocked";
              const isSelf = currentUser?.id === user.id;

              return (
                <Card key={user.id}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={[styles.badge, isBlocked ? styles.badgeBlocked : styles.badgeActive]}>
                    {user.role} · {user.status}
                  </Text>
                  <Text style={styles.meta}>{user.email}</Text>
                  <Text style={styles.meta}>{user.phone || "-"}</Text>
                  <Text style={styles.meta}>Joined: {formatDate(user.joinedAt)}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.activate, (!isBlocked || isSelf) && styles.actionDisabled]}
                      onPress={() => handleUpdateStatus(user, "active")}
                      disabled={!isBlocked || isSelf}
                    >
                      <Text style={styles.activateText}>Activate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.suspend, (isBlocked || isSelf) && styles.actionDisabled]}
                      onPress={() => handleUpdateStatus(user, "blocked")}
                      disabled={isBlocked || isSelf}
                    >
                      <Text style={styles.suspendText}>Suspend</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
        </ScreenContainer>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
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
  loader: { marginTop: 12 },
  empty: { color: colors.textSecondary, fontStyle: "italic", marginTop: 6 },
  name: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 3,
    fontWeight: "600",
  },
  badgeActive: { backgroundColor: colors.successSoft, color: colors.success },
  badgeBlocked: { backgroundColor: colors.dangerSoft, color: colors.danger },
  meta: { color: colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  activate: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.successSoft, alignItems: "center", paddingVertical: 9 },
  activateText: { color: colors.success, fontWeight: "700" },
  suspend: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, alignItems: "center", paddingVertical: 9 },
  suspendText: { color: colors.danger, fontWeight: "700" },
  actionDisabled: { opacity: 0.45 },
});
