import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "app_language";

const MESSAGES = {
  vi: {
    today: "Hôm nay",
    courts: "Sân",
    noCourtsYet: "Chưa có sân nào.",
    bookNow: "ĐẶT LỊCH",
    notifications: "Thông báo",
    noNewNotifications: "Bạn chưa có thông báo mới.",
    languageTitle: "Ngôn ngữ",
    languagePrompt: "Chọn ngôn ngữ hiển thị",
    vietnamese: "Tiếng Việt",
    english: "Tiếng Anh",
    map: "Bản đồ",
    cannotOpenGoogleMaps: "Không thể mở liên kết Google Maps.",
    openMap: "Mở bản đồ",
    chooseMapView: "Chọn cách xem vị trí sân.",
    cancel: "Hủy",
    defaultMaps: "Bản đồ mặc định",
    googleMaps: "Google Maps",
    error: "Lỗi",
    loadCourtDetailsFailed: "Không thể tải chi tiết sân.",
    bookingFailed: "Đặt lịch thất bại",
    missingCourtOrSlot: "Thiếu thông tin sân hoặc khung giờ.",
    bookingSuccessTitle: "Thành công",
    bookingSuccessMessage: "Đặt lịch thành công!",
    courtNotFound: "Không tìm thấy sân",
    bookCourt: "Đặt lịch sân",
    viewCourtOnMap: "Xem vị trí trên bản đồ",
    openMapInline: "Mở bản đồ",
    noRatingYet: "Chưa có đánh giá",
    tabInfo: "Thông tin",
    tabService: "Dịch vụ",
    tabImages: "Hình ảnh",
    tabTerms: "Điều khoản & quy định",
    tabReviews: "Đánh giá",
    availableSlots: "Khung giờ khả dụng",
    noAvailableSlots: "Không có khung giờ trống cho hôm nay.",
    available: "Còn trống",
    booked: "Đã đặt",
    book: "Đặt",
    noImages: "Chưa có hình ảnh.",
    comingSoonContent: "Nội dung sẽ được cập nhật trong phiên bản tiếp theo.",
  },
  en: {
    today: "Today",
    courts: "Courts",
    noCourtsYet: "No courts yet.",
    bookNow: "BOOK NOW",
    notifications: "Notifications",
    noNewNotifications: "You have no new notifications.",
    languageTitle: "Language",
    languagePrompt: "Choose display language",
    vietnamese: "Vietnamese",
    english: "English",
    map: "Map",
    cannotOpenGoogleMaps: "Cannot open Google Maps link.",
    openMap: "Open map",
    chooseMapView: "Choose how you want to view this location.",
    cancel: "Cancel",
    defaultMaps: "Default Maps",
    googleMaps: "Google Maps",
    error: "Error",
    loadCourtDetailsFailed: "Failed to load court details.",
    bookingFailed: "Booking failed",
    missingCourtOrSlot: "Court or slot information is missing.",
    bookingSuccessTitle: "Success",
    bookingSuccessMessage: "Booking created successfully!",
    courtNotFound: "Court not found",
    bookCourt: "Book court",
    viewCourtOnMap: "View court location on map",
    openMapInline: "Open map",
    noRatingYet: "No rating yet",
    tabInfo: "Info",
    tabService: "Service",
    tabImages: "Images",
    tabTerms: "Terms & policy",
    tabReviews: "Reviews",
    availableSlots: "Available slots",
    noAvailableSlots: "No available slots for today.",
    available: "Available",
    booked: "Booked",
    book: "Book",
    noImages: "No images.",
    comingSoonContent: "Content will be updated in the next version.",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("vi");

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "vi" || stored === "en") {
          setLanguage(stored);
        }
      } catch {
        // ignore storage failures
      }
    };
    load();
  }, []);

  const changeLanguage = async (nextLanguage) => {
    if (nextLanguage !== "vi" && nextLanguage !== "en") {
      return;
    }
    setLanguage(nextLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // ignore storage failures
    }
  };

  const value = useMemo(() => {
    const dictionary = MESSAGES[language] || MESSAGES.vi;
    return {
      language,
      setLanguage: changeLanguage,
      t: (key) => dictionary[key] || MESSAGES.vi[key] || key,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
}
