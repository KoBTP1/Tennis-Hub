import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { radius } from "../styles/theme";

export default function ImageGallery({
  images = [],
  mobileHeight = 200,
  webHeight = 300,
  maxWebWidth = 960,
}) {
  const { theme } = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const viewerScrollRef = useRef(null);
  const sanitizedImages = useMemo(
    () => (Array.isArray(images) ? images.map((url) => String(url || "").trim()).filter(Boolean) : []),
    [images]
  );
  const imageCount = sanitizedImages.length;
  const safeIndex = imageCount > 0 ? Math.min(activeIndex, imageCount - 1) : 0;
  const mainImageHeight = Platform.OS === "web" ? webHeight : mobileHeight;
  const galleryWidth = Platform.OS === "web" ? Math.max(280, Math.min(viewportWidth - 56, maxWebWidth)) : "100%";
  const viewerImageWidth = Math.max(280, viewportWidth);
  const viewerImageHeight = Platform.OS === "web" ? Math.max(280, Math.min(window.innerHeight - 130, 740)) : mobileHeight + 180;

  useEffect(() => {
    if (imageCount === 0) {
      return;
    }
    fadeAnim.setValue(0.75);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [safeIndex, fadeAnim, imageCount]);

  useEffect(() => {
    if (imageCount <= 1 || isViewerVisible) {
      return undefined;
    }
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % imageCount);
    }, 3500);
    return () => clearInterval(timer);
  }, [imageCount, isViewerVisible]);

  const openViewer = () => {
    if (imageCount === 0) {
      return;
    }
    setIsViewerVisible(true);
    requestAnimationFrame(() => {
      viewerScrollRef.current?.scrollTo?.({ x: safeIndex * viewerImageWidth, animated: false });
    });
  };

  if (imageCount === 0) {
    return null;
  }

  return (
    <View style={[styles.root, { width: galleryWidth }]}>
      <TouchableOpacity activeOpacity={0.92} onPress={openViewer} style={styles.mainImageWrap}>
        <Animated.Image
          source={{ uri: sanitizedImages[safeIndex] }}
          style={[styles.mainImage, { height: mainImageHeight, opacity: fadeAnim }]}
          resizeMode="cover"
        />
        {imageCount > 1 ? (
          <View style={[styles.countBadge, { backgroundColor: "rgba(2, 6, 23, 0.65)" }]}>
            <Text style={styles.countText}>
              {safeIndex + 1}/{imageCount}
            </Text>
          </View>
        ) : null}
        <View style={[styles.zoomHint, { backgroundColor: "rgba(2, 6, 23, 0.65)" }]}>
          <Text style={styles.zoomHintText}>Tap to view larger</Text>
        </View>
      </TouchableOpacity>

      {imageCount > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
          style={styles.thumbScroll}
        >
          {sanitizedImages.map((url, index) => (
            <TouchableOpacity
              key={`${url}-${index}`}
              activeOpacity={0.85}
              onPress={() => setActiveIndex(index)}
              style={[
                styles.thumbTouch,
                {
                  borderColor: index === safeIndex ? theme.info : theme.border,
                  opacity: index === safeIndex ? 1 : 0.75,
                },
              ]}
            >
              <Image source={{ uri: url }} style={styles.thumbImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <Modal visible={isViewerVisible} transparent animationType="fade" onRequestClose={() => setIsViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <View style={[styles.viewerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.viewerHeader}>
              <Text style={[styles.viewerTitle, { color: theme.text }]}>
                {safeIndex + 1}/{imageCount}
              </Text>
              <TouchableOpacity onPress={() => setIsViewerVisible(false)}>
                <Text style={[styles.closeText, { color: theme.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={viewerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const x = event.nativeEvent.contentOffset.x;
                const nextIndex = Math.round(x / viewerImageWidth);
                setActiveIndex(Math.max(0, Math.min(nextIndex, imageCount - 1)));
              }}
            >
              {sanitizedImages.map((url, index) => (
                <View key={`${url}-${index}`} style={[styles.viewerImageWrap, { width: viewerImageWidth }]}>
                  <Image source={{ uri: url }} style={[styles.viewerImage, { height: viewerImageHeight }]} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: "center", marginBottom: 10 },
  mainImageWrap: { width: "100%", borderRadius: radius.md, overflow: "hidden", position: "relative" },
  mainImage: { width: "100%", borderRadius: radius.md },
  countBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  thumbScroll: { marginTop: 8 },
  thumbRow: { gap: 8, paddingBottom: 2 },
  thumbTouch: {
    width: 72,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%" },
  zoomHint: {
    position: "absolute",
    left: 10,
    bottom: 10,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoomHintText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  viewerCard: {
    width: "100%",
    maxWidth: 1200,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    paddingTop: 10,
    paddingBottom: 8,
  },
  viewerHeader: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerTitle: { fontSize: 14, fontWeight: "700" },
  closeText: { fontSize: 14, fontWeight: "600" },
  viewerImageWrap: { alignItems: "center", justifyContent: "center" },
  viewerImage: { width: "100%" },
});
