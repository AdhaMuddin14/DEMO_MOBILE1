import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SecureVaultDemo } from "../../components/SecureVaultDemo";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { colors, styles as bookStyles } from "../../constants/styles";
import type { Database } from "../../types/database";

type LibraryTask = Database["public"]["Tables"]["library_tasks"]["Row"];

const dashboardStyles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 932,
    alignSelf: "center",
    padding: 16,
    gap: 12,
  },
  header: {
    marginBottom: 0,
    gap: 10,
  },
  headerTitle: {
    flexShrink: 1,
  },
  headerStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "700",
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: -6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.dark,
    backgroundColor: colors.white,
  },
  actionButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  taskCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  taskDetails: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  taskStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskActions: {
    flexDirection: "row",
    gap: 8,
  },
  logoutButton: {
    alignSelf: "center",
    minWidth: 160,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
});

export default function LibraryDashboard() {
  const { user, signOut } = useAuth();
  const metadataDisplayName = user?.user_metadata?.display_name;
  const currentDisplayName =
    typeof metadataDisplayName === "string" && metadataDisplayName.trim()
      ? metadataDisplayName
      : "Anggota Perpustakaan";
  const metadataRole = user?.user_metadata?.role;
  const memberRole =
    typeof metadataRole === "string" && metadataRole.trim()
      ? metadataRole
      : "Belum ditentukan";
  const [tasks, setTasks] = useState<LibraryTask[]>([]);
  const [profileName, setProfileName] = useState(
    typeof metadataDisplayName === "string" ? metadataDisplayName : "",
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [rewardPoints, setRewardPoints] = useState("100");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mutatingTaskIds, setMutatingTaskIds] = useState<number[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Memeriksa koneksi Supabase...");
  const [error, setError] = useState("");

  async function updateDisplayName() {
    if (!user || profileSaving) return;
    const cleanDisplayName = profileName.trim();
    if (!cleanDisplayName) {
      setProfileError("Nama pengguna tidak boleh kosong.");
      setProfileNotice("");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileNotice("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          display_name: cleanDisplayName,
        },
      });

      if (updateError) {
        throw new Error(`Gagal memperbarui nama: ${updateError.message}`);
      }

      setProfileName(cleanDisplayName);
      setProfileNotice("Nama pengguna berhasil diperbarui.");
    } catch (updateError) {
      setProfileError(
        updateError instanceof Error
          ? updateError.message
          : "Gagal memperbarui nama pengguna.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  const loadTasks = useCallback(async (isRefresh = false) => {
    if (!user) {
      setTasks([]);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("library_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        setConnectionStatus("Koneksi database gagal");
        setError(`Gagal memuat tugas: ${queryError.message}`);
      } else {
        setConnectionStatus("Supabase terhubung");
        setTasks(data ?? []);
      }
    } catch (loadError) {
      setConnectionStatus("Koneksi Supabase gagal");
      setError(
        loadError instanceof Error
          ? `Gagal memuat tugas: ${loadError.message}`
          : "Gagal memuat daftar tugas dari Supabase.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      void loadTasks();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadTasks, user]);

  async function addTask() {
    if (!user || submitting) return;
    const cleanTaskTitle = taskTitle.trim();
    const points = Number.parseInt(rewardPoints, 10);

    if (!cleanTaskTitle || !Number.isFinite(points) || points < 0) {
      setError("Judul tugas dan reward poin wajib valid.");
      return;
    }

    setSubmitting(true);
    setError("");

    const optimisticTask: LibraryTask = {
      id: -Date.now(),
      user_id: user.id,
      task_title: cleanTaskTitle,
      reward_points: points,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    setTasks((current) => [optimisticTask, ...current]);
    setTaskTitle("");

    try {
      const { data, error: insertError } = await supabase
        .from("library_tasks")
        .insert({
          user_id: user.id,
          task_title: cleanTaskTitle,
          reward_points: points,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Gagal menambahkan tugas: ${insertError.message}`);
      }
      setTasks((current) => [
        data,
        ...current.filter((item) => item.id !== optimisticTask.id),
      ]);
    } catch (insertError) {
      setTasks((current) =>
        current.filter((item) => item.id !== optimisticTask.id),
      );
      setTaskTitle(cleanTaskTitle);
      setError(
        insertError instanceof Error
          ? insertError.message
          : "Gagal menambahkan tugas.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: LibraryTask) {
    if (!user || mutatingTaskIds.includes(task.id)) return;
    setMutatingTaskIds((current) => [...current, task.id]);
    const nextStatus = task.status === "pending" ? "completed" : "pending";
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)),
    );

    try {
      const { error: updateError } = await supabase
        .from("library_tasks")
        .update({ status: nextStatus })
        .eq("id", task.id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (updateError) {
        throw new Error(`Gagal mengubah status tugas: ${updateError.message}`);
      }
    } catch (updateError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: task.status } : item,
        ),
      );
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Gagal mengubah status tugas.",
      );
    } finally {
      setMutatingTaskIds((current) => current.filter((id) => id !== task.id));
    }
  }

  async function deleteTask(task: LibraryTask) {
    if (!user || mutatingTaskIds.includes(task.id)) return;
    setMutatingTaskIds((current) => [...current, task.id]);
    const previous = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id));

    try {
      const { error: deleteError } = await supabase
        .from("library_tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (deleteError) {
        throw new Error(`Gagal menghapus tugas: ${deleteError.message}`);
      }
    } catch (deleteError) {
      setTasks(previous);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus tugas.",
      );
    } finally {
      setMutatingTaskIds((current) => current.filter((id) => id !== task.id));
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Logout gagal. Silakan coba lagi.",
      );
    }
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={dashboardStyles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void loadTasks(true)} />
      }
      data={tasks}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={[bookStyles.header, dashboardStyles.header]}>
            <View style={bookStyles.headerTop}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={bookStyles.smallText}>
                  BOOKLIST
                </Text>
                <Text style={[bookStyles.title, dashboardStyles.headerTitle]}>
                  Dashboard Koleksi
                </Text>
              </View>
              <Ionicons name="library-outline" size={42} color={colors.primary} />
            </View>
            <Text style={bookStyles.subtitle}>
              Halo, {currentDisplayName}
            </Text>
            <View style={dashboardStyles.headerStatus}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 }}>
                <Ionicons
                  name={connectionStatus.toLowerCase().includes("gagal") ? "cloud-offline-outline" : "cloud-done-outline"}
                  size={18}
                  color={connectionStatus.toLowerCase().includes("gagal") ? "#B91C1C" : colors.primary}
                />
                <Text
                  numberOfLines={2}
                  style={{
                    color: connectionStatus.toLowerCase().includes("gagal")
                      ? "#B91C1C"
                      : colors.primary,
                    fontSize: 13,
                    fontWeight: "600",
                    flexShrink: 1,
                  }}
                >
                  {connectionStatus}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Uji koneksi dan muat ulang data Supabase"
                onPress={() => void loadTasks()}
                disabled={loading}
                style={[
                  bookStyles.button,
                  {
                    minHeight: 40,
                    marginBottom: 0,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    opacity: loading ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="cloud-download-outline" size={17} color={colors.white} />
                <Text style={bookStyles.buttonText}>Uji Koneksi</Text>
              </Pressable>
            </View>
          </View>

          <View style={dashboardStyles.card}>
            <Text style={[bookStyles.sectionTitle, { marginBottom: 0 }]}>
              Profil Anggota
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={[bookStyles.author, { flex: 1 }]}>{user?.email ?? "Email tidak tersedia"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
              <Text style={[bookStyles.author, { flex: 1 }]}>Peran Anggota: {memberRole}</Text>
            </View>
            <Text style={dashboardStyles.fieldLabel}>Nama Pengguna</Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Masukkan nama pengguna"
              autoCapitalize="words"
              editable={!profileSaving}
              style={dashboardStyles.input}
            />
            {profileError ? (
              <Text accessibilityLiveRegion="polite" style={{ color: "#DC2626" }}>
                {profileError}
              </Text>
            ) : null}
            {profileNotice ? (
              <Text accessibilityLiveRegion="polite" style={{ color: "#15803D" }}>
                {profileNotice}
              </Text>
            ) : null}
            <Pressable
              onPress={() => void updateDisplayName()}
              disabled={profileSaving}
              style={[
                bookStyles.button,
                { marginBottom: 0, opacity: profileSaving ? 0.6 : 1 },
              ]}
            >
              {profileSaving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons name="person-outline" size={18} color={colors.white} />
              )}
              <Text style={bookStyles.buttonText}>
                {profileSaving ? "Menyimpan..." : "Perbarui Nama"}
              </Text>
            </Pressable>
          </View>

          <SecureVaultDemo />

          <View style={dashboardStyles.card}>
            <Text style={[bookStyles.sectionTitle, { marginBottom: 0 }]}>
              Tambah Tugas
            </Text>
            <Text style={dashboardStyles.fieldLabel}>Judul Tugas</Text>
            <TextInput
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="Masukkan judul tugas"
              editable={!submitting}
              style={dashboardStyles.input}
            />
            <Text style={dashboardStyles.fieldLabel}>Poin</Text>
            <TextInput
              value={rewardPoints}
              onChangeText={setRewardPoints}
              placeholder="Contoh: 100"
              keyboardType="number-pad"
              editable={!submitting}
              style={dashboardStyles.input}
            />
            <Pressable
              onPress={addTask}
              disabled={submitting}
              style={[
                bookStyles.button,
                { marginBottom: 0, opacity: submitting ? 0.6 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              )}
              <Text style={bookStyles.buttonText}>
                {submitting ? "Menambahkan..." : "Tambah Tugas"}
              </Text>
            </Pressable>
          </View>

          <Text style={[bookStyles.sectionTitle, { marginBottom: 0 }]}>
            Daftar Tugas Koleksi
          </Text>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={{ color: "#DC2626" }}>
              {error}
            </Text>
          ) : null}
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      }
      renderItem={({ item }) => {
        const isCompleted = item.status === "completed";
        const isBusy = item.id < 0 || mutatingTaskIds.includes(item.id);

        return (
          <View
            style={[
              dashboardStyles.taskCard,
              {
                borderLeftWidth: 4,
                borderLeftColor: isCompleted ? "#16A34A" : colors.primary,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={[
                  bookStyles.iconBox,
                  {
                    width: 56,
                    height: 56,
                    backgroundColor: isCompleted ? "#DCFCE7" : colors.header,
                  },
                ]}
              >
                <Ionicons
                  name={isCompleted ? "checkmark-circle-outline" : "book-outline"}
                  size={30}
                  color={isCompleted ? "#16A34A" : colors.primary}
                />
              </View>
              <View style={dashboardStyles.taskDetails}>
                <Text style={bookStyles.bookTitle}>{item.task_title}</Text>
                <Text style={bookStyles.author}>{item.reward_points} poin</Text>
                <View style={dashboardStyles.taskStatus}>
                  <Ionicons
                    name={isCompleted ? "checkmark-circle" : "time-outline"}
                    size={15}
                    color={isCompleted ? "#15803D" : colors.primary}
                  />
                  <Text
                    style={[
                      bookStyles.status,
                      { color: isCompleted ? "#15803D" : colors.primary },
                    ]}
                  >
                    {isCompleted ? "Selesai" : "Belum selesai"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={dashboardStyles.taskActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void toggleTask(item)}
                disabled={isBusy}
                style={[
                  dashboardStyles.actionButton,
                  { flex: 1, backgroundColor: colors.primary, opacity: isBusy ? 0.6 : 1 },
                ]}
              >
                <Ionicons
                  name={isCompleted ? "refresh-outline" : "checkmark-circle-outline"}
                  size={18}
                  color={colors.white}
                />
                <Text style={[bookStyles.buttonText, { fontSize: 13, flexShrink: 1 }]}>
                  {isCompleted ? "Buka Lagi" : "Tandai Selesai"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void deleteTask(item)}
                disabled={isBusy}
                style={[
                  dashboardStyles.actionButton,
                  {
                    flex: 1,
                    backgroundColor: "#DC2626",
                    opacity: isBusy ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.white} />
                <Text style={[bookStyles.buttonText, { fontSize: 13 }]}>Hapus</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        !loading && !error ? (
          <View style={[dashboardStyles.card, { alignItems: "center", paddingVertical: 24 }]}>
            <Ionicons name="library-outline" size={34} color={colors.primary} />
            <Text style={{ color: colors.text, textAlign: "center" }}>
              Belum ada tugas koleksi.
            </Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          style={dashboardStyles.logoutButton}
        >
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Ionicons name="log-out-outline" size={19} color={colors.primary} />
            <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700" }}>
              Keluar
            </Text>
          </View>
        </Pressable>
      }
    />
  );
}
