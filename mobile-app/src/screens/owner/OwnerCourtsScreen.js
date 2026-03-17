import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import CourtCard from "../../components/CourtCard";
import GradientButton from "../../components/GradientButton";
import Card from "../../components/Card";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { createOwnerCourt, deleteOwnerCourt, getOwnerCourts, updateOwnerCourt, uploadOwnerCourtImage } from "../../services/ownerService";
import { colors, radius } from "../../styles/theme";
import { formatVNDPerHour } from "../../utils/currency";

function parseStyledText(input) {
  let raw = String(input || "").trim();
  const style = { fontWeight: "500", fontStyle: "normal", fontSize: 15, color: null, textAlign: "left" };

  const wrappers = [
    { regex: /^\[size=(\d{1,2})\](.*)\[\/size\]$/is, apply: (match) => ({ key: "fontSize", value: Math.max(12, Math.min(Number(match[1]) || 15, 30)), text: match[2] }) },
    { regex: /^\[color=(#[0-9a-f]{6})\](.*)\[\/color\]$/is, apply: (match) => ({ key: "color", value: match[1], text: match[2] }) },
    { regex: /^\[align=(left|center|right)\](.*)\[\/align\]$/is, apply: (match) => ({ key: "textAlign", value: match[1], text: match[2] }) },
  ];

  let hasWrapper = true;
  while (hasWrapper) {
    hasWrapper = false;
    for (const wrapper of wrappers) {
      const matched = wrapper.regex.exec(raw);
      if (matched) {
        const result = wrapper.apply(matched);
        style[result.key] = result.value;
        raw = String(result.text || "").trim();
        hasWrapper = true;
        break;
      }
    }
  }

  const boldMatch = /^\*\*(.*)\*\*$/s.exec(raw);
  if (boldMatch) {
    style.fontWeight = "700";
    raw = String(boldMatch[1] || "").trim();
  }
  const italicMatch = /^\*(.*)\*$/s.exec(raw);
  if (italicMatch) {
    style.fontStyle = "italic";
    raw = String(italicMatch[1] || "").trim();
  }

  return { text: raw, style };
}

function parseServiceContent(rawContent) {
  const lines = String(rawContent || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("#")) {
      const title = line.replace(/^#+\s*/, "").trim() || "Dich vu";
      current = { title, rows: [] };
      sections.push(current);
      continue;
    }
    if (!line.includes("|")) {
      continue;
    }
    const [name, ...rest] = line.split("|");
    const price = rest.join("|");
    if (!current) {
      current = { title: "Dich vu", rows: [] };
      sections.push(current);
    }
    current.rows.push({
      name: String(name || "").trim(),
      price: String(price || "").trim(),
    });
  }
  return sections.filter((item) => item.rows.length > 0);
}

function buildServicePreviewHtml(rawHtml) {
  const safeHtml = String(rawHtml || "")
    .replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replaceAll("</script>", "<\\/script>");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; padding: 10px; font-family: Inter, Arial, sans-serif; color: #111827; background: transparent; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      td, th { border: 1px solid #9ca3af; padding: 8px; vertical-align: top; }
    </style>
  </head>
  <body>${safeHtml}</body>
</html>`;
}

function clampHourMinute(hourText, minuteText) {
  const hour = Math.max(0, Math.min(23, Number(hourText) || 0));
  const minute = Math.max(0, Math.min(59, Number(minuteText) || 0));
  return {
    hour: String(hour).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
  };
}

function toMaskedTime(digitsSegment) {
  const digits = String(digitsSegment || "").replaceAll(/\D/g, "").slice(0, 4);
  let hourText = "00";
  let minuteText = "00";
  if (digits.length === 1) {
    hourText = `0${digits}`;
  } else if (digits.length === 2) {
    hourText = digits;
  } else if (digits.length === 3) {
    hourText = `0${digits.slice(0, 1)}`;
    minuteText = digits.slice(1, 3);
  } else if (digits.length === 4) {
    hourText = digits.slice(0, 2);
    minuteText = digits.slice(2, 4);
  }
  const normalized = clampHourMinute(hourText, minuteText);
  return `${normalized.hour}:${normalized.minute}`;
}

function formatOpeningHoursMask(rawInput) {
  const digits = String(rawInput || "").replaceAll(/\D/g, "").slice(0, 8);
  const startDigits = digits.slice(0, 4);
  const endDigits = digits.slice(4, 8);
  return `${toMaskedTime(startDigits)}- ${toMaskedTime(endDigits)}`;
}

function extractOpeningHoursDigits(rawInput) {
  return String(rawInput || "").replaceAll(/\D/g, "").slice(0, 8);
}

function normalizeOpeningHours(rawInput) {
  const masked = String(rawInput || "").trim();
  const matched = /^([01]\d|2[0-3]):([0-5]\d)- ([01]\d|2[0-3]):([0-5]\d)$/.exec(masked);
  if (!matched) {
    return "";
  }
  return `${matched[1]}:${matched[2]}- ${matched[3]}:${matched[4]}`;
}

function formatPriceInput(rawInput) {
  const digits = String(rawInput || "").replaceAll(/\D/g, "");
  if (!digits) {
    return "";
  }
  const normalized = digits.replaceAll(/^0+(?=\d)/g, "");
  return `${normalized.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".")} đ`;
}

function parsePriceNumber(rawInput) {
  const digits = String(rawInput || "").replaceAll(/\D/g, "");
  if (!digits) {
    return Number.NaN;
  }
  return Number(digits);
}

function buildServiceEditorHtml(initialHtml = "") {
  const initialHtmlJson = JSON.stringify(String(initialHtml || ""));
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; font-family: Inter, Arial, sans-serif; }
      body { margin: 0; padding: 0; background: #fff; color: #111827; }
      .toolbar {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 8px;
        border-bottom: 1px solid #e5e7eb; background: #f8fafc;
        position: sticky; top: 0; z-index: 2;
      }
      .btn, select, input[type="color"] {
        border: 1px solid #d1d5db; border-radius: 6px; background: #fff;
        min-height: 30px; padding: 4px 8px; font-size: 12px; color: #111827;
      }
      .btn { cursor: pointer; }
      .color-pop {
        position: relative;
      }
      .color-palette {
        display: none;
        position: absolute;
        top: 34px;
        left: 0;
        z-index: 4;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 6px;
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.16);
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        min-width: 170px;
      }
      .color-palette.open {
        display: grid;
      }
      .swatch {
        width: 22px;
        height: 22px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 0;
        min-height: 22px;
      }
      #editorWrap { padding: 8px; }
      #editor {
        min-height: 220px; outline: none; padding: 8px; border: 1px dashed #d1d5db; border-radius: 8px;
      }
      #editor:empty:before {
        content: "Dich vu";
        color: #94a3b8;
      }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      td, th { border: 1px solid #9ca3af; padding: 8px; min-width: 80px; }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button class="btn" type="button" data-cmd="bold"><b>B</b></button>
      <button class="btn" type="button" data-cmd="italic"><i>I</i></button>
      <button class="btn" type="button" data-cmd="justifyLeft">Trai</button>
      <button class="btn" type="button" data-cmd="justifyCenter">Giua</button>
      <button class="btn" type="button" data-cmd="justifyRight">Phai</button>
      <select id="fontFamily">
        <option value="">Font</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>
      <select id="fontSizePx">
        <option value="">Size</option>
        <option value="12">12</option>
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="20">20</option>
        <option value="24">24</option>
      </select>
      <div class="color-pop">
        <button class="btn" type="button" id="toggleColorPaletteBtn">Color</button>
        <div class="color-palette" id="colorPalette">
          <button class="swatch" type="button" data-color="#111827" style="background:#111827;" title="Black"></button>
          <button class="swatch" type="button" data-color="#475569" style="background:#475569;" title="Slate"></button>
          <button class="swatch" type="button" data-color="#065f46" style="background:#065f46;" title="Green"></button>
          <button class="swatch" type="button" data-color="#16a34a" style="background:#16a34a;" title="Light green"></button>
          <button class="swatch" type="button" data-color="#1d4ed8" style="background:#1d4ed8;" title="Blue"></button>
          <button class="swatch" type="button" data-color="#0ea5e9" style="background:#0ea5e9;" title="Sky"></button>
          <button class="swatch" type="button" data-color="#7c3aed" style="background:#7c3aed;" title="Violet"></button>
          <button class="swatch" type="button" data-color="#db2777" style="background:#db2777;" title="Pink"></button>
          <button class="swatch" type="button" data-color="#b91c1c" style="background:#b91c1c;" title="Red"></button>
          <button class="swatch" type="button" data-color="#ea580c" style="background:#ea580c;" title="Orange"></button>
          <button class="swatch" type="button" data-color="#ca8a04" style="background:#ca8a04;" title="Yellow"></button>
          <button class="swatch" type="button" data-color="#ffffff" style="background:#ffffff;" title="White"></button>
        </div>
      </div>
      <button class="btn" type="button" id="insertTableBtn">Table</button>
      <button class="btn" type="button" id="insertRowBtn">+ Row</button>
      <button class="btn" type="button" id="insertColBtn">+ Col</button>
      <button class="btn" type="button" id="deleteRowBtn" title="Delete row">🗑R</button>
      <button class="btn" type="button" id="deleteColBtn" title="Delete column">🗑C</button>
    </div>
    <div id="editorWrap">
      <div id="editor" contenteditable="true"></div>
    </div>
    <script>
      const editor = document.getElementById("editor");
      const initialHtml = ${initialHtmlJson};
      editor.innerHTML = initialHtml || "";
      let savedRange = null;
      let activeTableId = "";
      let tableCounter = 0;

      document.execCommand("styleWithCSS", false, true);

      function ensureTableId(table) {
        if (!table) return "";
        const existing = table.getAttribute("data-table-id");
        if (existing) return existing;
        tableCounter += 1;
        const nextId = "tbl-" + Date.now() + "-" + tableCounter;
        table.setAttribute("data-table-id", nextId);
        return nextId;
      }

      function initExistingTables() {
        editor.querySelectorAll("table").forEach((table) => {
          ensureTableId(table);
        });
      }

      function saveSelection() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          savedRange = range.cloneRange();
          const selectedTable = getTableFromNode(range.commonAncestorContainer);
          if (selectedTable) {
            activeTableId = ensureTableId(selectedTable);
          }
        }
      }

      function restoreSelection() {
        if (!savedRange) return;
        const selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }

      function getCurrentTableFromSelection() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return null;
        const table = getTableFromNode(selection.getRangeAt(0).commonAncestorContainer);
        if (table) {
          activeTableId = ensureTableId(table);
          return table;
        }
        return null;
      }

      function getTableFromNode(node) {
        let current = node;
        if (current && current.nodeType === Node.TEXT_NODE) {
          current = current.parentElement;
        }
        while (current && current.nodeName !== "TABLE") {
          current = current.parentElement;
        }
        return current || null;
      }

      function getCellFromNode(node) {
        let current = node;
        if (current && current.nodeType === Node.TEXT_NODE) {
          current = current.parentElement;
        }
        while (current && current.nodeName !== "TD" && current.nodeName !== "TH") {
          current = current.parentElement;
        }
        return current || null;
      }

      function getCurrentCellFromSelection() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return null;
        return getCellFromNode(selection.getRangeAt(0).commonAncestorContainer);
      }

      function getFallbackTable() {
        if (activeTableId) {
          const active = editor.querySelector('table[data-table-id="' + activeTableId + '"]');
          if (active) return active;
        }
        const tables = editor.querySelectorAll("table");
        if (!tables.length) return null;
        const lastTable = tables[tables.length - 1];
        activeTableId = ensureTableId(lastTable);
        return lastTable;
      }

      function postChange() {
        const payload = { type: "change", html: editor.innerHTML || "" };
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      }

      function applyFontSizePx(px) {
        if (!px) return;
        document.execCommand("fontSize", false, "7");
        const fonts = editor.querySelectorAll('font[size="7"]');
        fonts.forEach((node) => {
          const span = document.createElement("span");
          span.style.fontSize = px + "px";
          span.innerHTML = node.innerHTML;
          node.parentNode.replaceChild(span, node);
        });
        postChange();
      }

      function applyTextColor(color) {
        const value = color || "#065f46";
        document.execCommand("foreColor", false, value);
        saveSelection();
        postChange();
      }

      function closeColorPalette() {
        const palette = document.getElementById("colorPalette");
        if (palette) {
          palette.classList.remove("open");
        }
      }

      function insertTable() {
        editor.focus();
        restoreSelection();
        const html = '<table><tr><th>Dich vu</th><th>Gia</th></tr><tr><td>Ten dich vu</td><td>100.000 d</td></tr></table><p></p>';
        document.execCommand("insertHTML", false, html);
        initExistingTables();
        const tables = editor.querySelectorAll("table");
        if (tables.length > 0) {
          activeTableId = ensureTableId(tables[tables.length - 1]);
        }
        saveSelection();
        postChange();
      }

      function insertRowToCurrentTable() {
        editor.focus();
        restoreSelection();
        const node = getCurrentTableFromSelection() || getFallbackTable();
        if (!node) {
          insertTable();
          return;
        }
        const columnCount = node.rows?.[0]?.cells?.length || 2;
        const row = node.insertRow(-1);
        for (let i = 0; i < columnCount; i += 1) {
          const cell = row.insertCell(i);
          cell.innerHTML = i === 0 ? "Ten dich vu" : "0 d";
        }
        saveSelection();
        postChange();
      }

      function insertColToCurrentTable() {
        editor.focus();
        restoreSelection();
        const node = getCurrentTableFromSelection() || getFallbackTable();
        if (!node) {
          insertTable();
          return;
        }
        const rows = Array.from(node.rows || []);
        rows.forEach((row, index) => {
          const cellTag = index === 0 ? "th" : "td";
          const cell = document.createElement(cellTag);
          cell.innerHTML = index === 0 ? "Cot moi" : "0 d";
          row.appendChild(cell);
        });
        saveSelection();
        postChange();
      }

      function deleteRowFromCurrentTable() {
        editor.focus();
        restoreSelection();
        const node = getCurrentTableFromSelection() || getFallbackTable();
        if (!node) return;
        const selectedCell = getCurrentCellFromSelection();
        let targetRow = null;
        if (selectedCell && selectedCell.parentElement && selectedCell.parentElement.nodeName === "TR") {
          targetRow = selectedCell.parentElement;
        } else if (node.rows && node.rows.length > 0) {
          targetRow = node.rows[node.rows.length - 1];
        }
        if (!targetRow) return;
        targetRow.remove();
        if (!node.rows || node.rows.length === 0) {
          node.remove();
        }
        saveSelection();
        postChange();
      }

      function deleteColFromCurrentTable() {
        editor.focus();
        restoreSelection();
        const node = getCurrentTableFromSelection() || getFallbackTable();
        if (!node) return;
        const totalColumns = node.rows?.[0]?.cells?.length || 0;
        if (totalColumns <= 0) return;
        const selectedCell = getCurrentCellFromSelection();
        const targetColIndex = selectedCell ? selectedCell.cellIndex : totalColumns - 1;
        const rows = Array.from(node.rows || []);
        rows.forEach((row) => {
          if (row.cells && row.cells.length > targetColIndex) {
            row.deleteCell(targetColIndex);
          }
        });
        const remainingColumns = node.rows?.[0]?.cells?.length || 0;
        if (remainingColumns <= 0) {
          node.remove();
        }
        saveSelection();
        postChange();
      }

      const toolbarButtonControls = document.querySelectorAll(".toolbar .btn, .toolbar .swatch");
      toolbarButtonControls.forEach((control) => {
        control.addEventListener("mousedown", (event) => {
          event.preventDefault();
          editor.focus();
          restoreSelection();
        });
        control.addEventListener("touchstart", () => {
          editor.focus();
          restoreSelection();
        }, { passive: true });
      });

      const toolbarInputControls = document.querySelectorAll(".toolbar select");
      toolbarInputControls.forEach((control) => {
        control.addEventListener("mousedown", () => {
          saveSelection();
        });
        control.addEventListener("touchstart", () => {
          saveSelection();
        }, { passive: true });
      });

      document.querySelectorAll("[data-cmd]").forEach((button) => {
        button.addEventListener("click", () => {
          editor.focus();
          restoreSelection();
          const cmd = button.getAttribute("data-cmd");
          document.execCommand(cmd, false, null);
          saveSelection();
          postChange();
        });
      });

      document.getElementById("fontFamily").addEventListener("change", (event) => {
        editor.focus();
        restoreSelection();
        const value = event.target.value;
        if (!value) return;
        document.execCommand("fontName", false, value);
        saveSelection();
        postChange();
      });

      document.getElementById("fontSizePx").addEventListener("change", (event) => {
        editor.focus();
        restoreSelection();
        const value = Number(event.target.value);
        if (!Number.isFinite(value)) return;
        applyFontSizePx(value);
        saveSelection();
      });

      document.querySelectorAll(".swatch[data-color]").forEach((button) => {
        button.addEventListener("click", () => {
          editor.focus();
          restoreSelection();
          applyTextColor(button.getAttribute("data-color") || "#065f46");
          closeColorPalette();
        });
      });

      document.getElementById("toggleColorPaletteBtn").addEventListener("click", () => {
        const palette = document.getElementById("colorPalette");
        if (!palette) return;
        const isOpen = palette.classList.contains("open");
        if (isOpen) {
          palette.classList.remove("open");
        } else {
          palette.classList.add("open");
        }
      });

      document.getElementById("insertTableBtn").addEventListener("click", insertTable);
      document.getElementById("insertRowBtn").addEventListener("click", insertRowToCurrentTable);
      document.getElementById("insertColBtn").addEventListener("click", insertColToCurrentTable);
      document.getElementById("deleteRowBtn").addEventListener("click", deleteRowFromCurrentTable);
      document.getElementById("deleteColBtn").addEventListener("click", deleteColFromCurrentTable);

      editor.addEventListener("input", postChange);
      editor.addEventListener("keyup", () => { saveSelection(); postChange(); });
      editor.addEventListener("mouseup", () => { saveSelection(); postChange(); });
      editor.addEventListener("touchend", () => { saveSelection(); postChange(); });
      editor.addEventListener("focus", saveSelection);
      document.addEventListener("click", (event) => {
        const palette = document.getElementById("colorPalette");
        const colorWrap = document.querySelector(".color-pop");
        if (!palette || !colorWrap) return;
        if (!colorWrap.contains(event.target)) {
          palette.classList.remove("open");
        }
      });
      initExistingTables();
      postChange();
    </script>
  </body>
</html>`;
}

export default function OwnerCourtsScreen({ onOpenCourt, onNavigate, embedded = false, favoriteOverrides = {}, onFavoriteStateChange }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [name, setName] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressEnglish, setAddressEnglish] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [zaloLink, setZaloLink] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [openingHoursDigits, setOpeningHoursDigits] = useState("");
  const lastOpeningHoursKeyRef = useRef("");
  const [description, setDescription] = useState("");
  const [serviceContent, setServiceContent] = useState("");
  const [serviceEditorInitialHtml, setServiceEditorInitialHtml] = useState("");
  const [serviceEditorSeed, setServiceEditorSeed] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [activeSelector, setActiveSelector] = useState(null);
  const [pendingProvinceName, setPendingProvinceName] = useState("");
  const [pendingDistrictName, setPendingDistrictName] = useState("");
  const [pendingWardName, setPendingWardName] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSuggestingAddress, setIsSuggestingAddress] = useState(false);
  const [previewCoordinates, setPreviewCoordinates] = useState(null);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState(null);
  const [isResolvingPinnedAddress, setIsResolvingPinnedAddress] = useState(false);
  const parsedServiceSections = useMemo(() => parseServiceContent(serviceContent), [serviceContent]);
  const hasHtmlServiceContent = /<[^>]+>/.test(String(serviceContent || ""));
  const openingHoursMask = useMemo(() => formatOpeningHoursMask(openingHoursDigits), [openingHoursDigits]);
  const openingHours = useMemo(() => normalizeOpeningHours(openingHoursMask), [openingHoursMask]);

  const resetForm = () => {
    setEditingCourtId(null);
    setName("");
    setAddressDetail("");
    setAddressEnglish("");
    setPricePerHour("");
    setContactPhone("");
    setZaloLink("");
    setFacebookLink("");
    setOpeningHoursDigits("");
    setDescription("");
    setServiceContent("");
    setServiceEditorInitialHtml("");
    setServiceEditorSeed((prev) => prev + 1);
    setImageUrls([]);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setPendingProvinceName("");
    setPendingDistrictName("");
    setPendingWardName("");
    setAddressSuggestions([]);
    setPreviewCoordinates(null);
  };

  const isSameName = (left, right) => String(left || "").localeCompare(String(right || ""), "vi", { sensitivity: "base" }) === 0;

  const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Unable to load address data.");
    }
    return response.json();
  };
  const searchAddressCandidates = async (queryText) => {
    const keyword = String(queryText || "").trim();
    if (!keyword) {
      return [];
    }
    const withCountry = /,\s*vietnam$/i.test(keyword) ? keyword : `${keyword}, Vietnam`;
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(withCountry)}`
    );
    return Array.isArray(data)
      ? data
          .map((item) => ({
            displayName: String(item?.display_name || "").trim(),
            lat: Number(item?.lat),
            lon: Number(item?.lon),
          }))
          .filter((item) => item.displayName)
      : [];
  };

  const loadProvinces = async () => {
    try {
      setIsAddressLoading(true);
      const data = await fetchJson("https://provinces.open-api.vn/api/p/");
      const items = Array.isArray(data) ? data.map((item) => ({ code: item.code, name: item.name })) : [];
      setProvinces(items);
    } catch {
      setProvinces([]);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const loadDistricts = async (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    try {
      setIsAddressLoading(true);
      const data = await fetchJson(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const items = Array.isArray(data?.districts) ? data.districts.map((item) => ({ code: item.code, name: item.name })) : [];
      setDistricts(items);
    } catch {
      setDistricts([]);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const loadWards = async (districtCode) => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    try {
      setIsAddressLoading(true);
      const data = await fetchJson(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const items = Array.isArray(data?.wards) ? data.wards.map((item) => ({ code: item.code, name: item.name })) : [];
      setWards(items);
    } catch {
      setWards([]);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const loadCourts = async () => {
    try {
      setIsLoading(true);
      const response = await getOwnerCourts();
      setCourts(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      Alert.alert("Load courts failed", error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince?.code) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      return;
    }
    loadDistricts(selectedProvince.code);
  }, [selectedProvince?.code]);

  useEffect(() => {
    if (!selectedDistrict?.code) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    loadWards(selectedDistrict.code);
  }, [selectedDistrict?.code]);

  useEffect(() => {
    if (!pendingProvinceName || provinces.length === 0) {
      return;
    }
    const matched = provinces.find((item) => isSameName(item.name, pendingProvinceName));
    if (matched) {
      setSelectedProvince(matched);
      setPendingProvinceName("");
    }
  }, [pendingProvinceName, provinces]);

  useEffect(() => {
    if (!pendingDistrictName || districts.length === 0) {
      return;
    }
    const matched = districts.find((item) => isSameName(item.name, pendingDistrictName));
    if (matched) {
      setSelectedDistrict(matched);
      setPendingDistrictName("");
    }
  }, [pendingDistrictName, districts]);

  useEffect(() => {
    if (!pendingWardName || wards.length === 0) {
      return;
    }
    const matched = wards.find((item) => isSameName(item.name, pendingWardName));
    if (matched) {
      setSelectedWard(matched);
      setPendingWardName("");
    }
  }, [pendingWardName, wards]);

  useEffect(() => {
    const areaKeyword = [selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(", ");
    const detailKeyword = addressDetail.trim();
    const primaryKeyword = [detailKeyword, areaKeyword].filter(Boolean).join(", ");
    if (!primaryKeyword) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggestingAddress(true);
        let items = await searchAddressCandidates(primaryKeyword);
        if ((!items || items.length === 0) && areaKeyword && detailKeyword) {
          items = await searchAddressCandidates(areaKeyword);
        }
        setAddressSuggestions(items || []);
        if (items?.[0] && Number.isFinite(items[0].lat) && Number.isFinite(items[0].lon)) {
          setPreviewCoordinates({ lat: items[0].lat, lon: items[0].lon });
        }
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSuggestingAddress(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [addressDetail, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]);

  const handleSaveCourt = async () => {
    if (!name.trim() || !addressDetail.trim() || !pricePerHour.trim() || !contactPhone.trim()) {
      Alert.alert("Validation", "Please enter name, address, price, contact phone and opening hours.");
      return;
    }
    if (isUploadingImage) {
      Alert.alert("Image upload", "Image is still uploading. Please wait a moment.");
      return;
    }

    const parsedPrice = parsePriceNumber(pricePerHour);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Validation", "Price per hour must be a valid number >= 0.");
      return;
    }
    if (!openingHours || openingHoursDigits.length === 0) {
      Alert.alert("Validation", "Opening hours must follow HH:mm- HH:mm (e.g. 06:00- 22:00).");
      return;
    }

    try {
      setIsSaving(true);
      const composedLocation = [
        addressDetail.trim(),
        selectedWard?.name || "",
        selectedDistrict?.name || "",
        selectedProvince?.name || "",
      ]
        .filter(Boolean)
        .join(", ");
      const normalizedLocationEn = String(addressEnglish || "").trim();
      const resolvedServiceContent = String(serviceContent || serviceEditorInitialHtml || "").trim();
      const payload = {
        name: name.trim(),
        location: composedLocation,
        locationVi: composedLocation,
        locationEn: normalizedLocationEn || composedLocation,
        pricePerHour: parsedPrice,
        contactPhone: contactPhone.trim(),
        zaloLink: zaloLink.trim(),
        facebookLink: facebookLink.trim(),
        openingHours,
        description: description.trim(),
        serviceContent: resolvedServiceContent,
        mapUrl: getGoogleMapsSearchUrl(composedLocation, previewCoordinates),
        images: imageUrls,
      };
      if (editingCourtId) {
        await updateOwnerCourt(editingCourtId, payload);
      } else {
        await createOwnerCourt(payload);
      }
      resetForm();
      await loadCourts();
      Alert.alert("Success", editingCourtId ? "Court updated successfully." : "Add new court successfully.");
    } catch (error) {
      Alert.alert("Save court failed", error?.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourt = (court) => {
    setEditingCourtId(court.id);
    setName(court.name || "");
    const rawLocation = String(court.locationVi || court.location || "").trim();
    setAddressEnglish(String(court.locationEn || "").trim());
    const parts = rawLocation.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 4) {
      setAddressDetail(parts.slice(0, -3).join(", "));
      setPendingWardName(parts.at(-3) || "");
      setPendingDistrictName(parts.at(-2) || "");
      setPendingProvinceName(parts.at(-1) || "");
    } else {
      setAddressDetail(rawLocation);
      setPendingWardName("");
      setPendingDistrictName("");
      setPendingProvinceName("");
    }
    setPricePerHour(formatPriceInput(String(court.pricePerHour || "")));
    setContactPhone(court.contactPhone || "");
    setZaloLink(court.zaloLink || "");
    setFacebookLink(court.facebookLink || "");
    setOpeningHoursDigits(extractOpeningHoursDigits(String(court.openingHours || "")));
    setDescription(court.description || "");
    setServiceContent(court.serviceContent || "");
    setServiceEditorInitialHtml(court.serviceContent || "");
    setServiceEditorSeed((prev) => prev + 1);
    setImageUrls(Array.isArray(court.images) ? court.images.map((item) => String(item || "").trim()).filter(Boolean) : []);
  };

  const getGoogleMapsSearchUrl = (queryText, coordinates = null) => {
    if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lon)) {
      return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lon}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(queryText || "").trim())}`;
  };
  const reverseGeocodeCoordinates = async ({ lat, lon }) => {
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    );
    const address = data?.address || {};
    const detail =
      address.house_number && address.road
        ? `${address.house_number} ${address.road}`
        : address.road || address.neighbourhood || address.suburb || address.city_district || data?.name || "";
    return String(detail || "").trim();
  };
  const getOsmEmbedUrl = (queryText, coordinates = null) => {
    const hasDetail = Boolean(addressDetail.trim());
    const hasWard = Boolean(selectedWard?.name);
    const hasDistrict = Boolean(selectedDistrict?.name);
    const hasProvince = Boolean(selectedProvince?.name);
    let mapZoom = 13;
    if (hasProvince) {
      mapZoom = 10;
    }
    if (hasDistrict) {
      mapZoom = 12;
    }
    if (hasWard) {
      mapZoom = 15;
    }
    if (hasDetail) {
      mapZoom = 17;
    }
    if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lon)) {
      return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${coordinates.lat},${coordinates.lon}&zoom=${mapZoom}`;
    }
    return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${encodeURIComponent(String(queryText || "").trim())}&zoom=${mapZoom}`;
  };
  const fullAddress = useMemo(
    () => [addressDetail.trim(), selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(", "),
    [addressDetail, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]
  );
  const embeddedMapUrl = useMemo(() => getOsmEmbedUrl(fullAddress, previewCoordinates), [fullAddress, previewCoordinates]);
  const pickerZoomLevel = useMemo(() => {
    if (addressDetail.trim()) {
      return 17;
    }
    if (selectedWard?.name) {
      return 15;
    }
    if (selectedDistrict?.name) {
      return 12;
    }
    if (selectedProvince?.name) {
      return 10;
    }
    return 13;
  }, [addressDetail, selectedDistrict?.name, selectedProvince?.name, selectedWard?.name]);
  const initialPickerLat = Number.isFinite(previewCoordinates?.lat) ? previewCoordinates.lat : 21.028511;
  const initialPickerLon = Number.isFinite(previewCoordinates?.lon) ? previewCoordinates.lon : 105.804817;
  const mapPickerHtml = useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      .hint {
        position: absolute; top: 10px; left: 10px; z-index: 1000;
        background: rgba(17,24,39,0.85); color: #fff; padding: 8px 10px; border-radius: 8px;
        font-family: sans-serif; font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="hint">Tap map to place pin</div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const initialLat = ${initialPickerLat};
      const initialLon = ${initialPickerLon};
      const initialZoom = ${pickerZoomLevel};
      const map = L.map('map').setView([initialLat, initialLon], Math.max(5, initialZoom - 1));
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);
      let marker = L.marker([initialLat, initialLon], { draggable: true }).addTo(map);
      function sendPicked(lat, lon) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'picked', lat, lon }));
      }
      sendPicked(initialLat, initialLon);
      setTimeout(function() {
        map.flyTo([initialLat, initialLon], initialZoom, { animate: true, duration: 0.28 });
      }, 120);
      map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.25 });
        sendPicked(lat, lng);
      });
      marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        map.flyTo([pos.lat, pos.lng], map.getZoom(), { animate: true, duration: 0.25 });
        sendPicked(pos.lat, pos.lng);
      });
    </script>
  </body>
</html>`,
    [initialPickerLat, initialPickerLon, pickerZoomLevel]
  );

  const handleOpenMap = async (targetCourt) => {
    const directUrl = String(targetCourt?.mapUrl || "").trim();
    const localizedLocation =
      language === "en"
        ? String(targetCourt?.locationEn || targetCourt?.locationVi || targetCourt?.location || "").trim()
        : String(targetCourt?.locationVi || targetCourt?.location || targetCourt?.locationEn || "").trim();
    const fallbackUrl = getGoogleMapsSearchUrl(localizedLocation || targetCourt?.name);
    const url = directUrl || fallbackUrl;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Map", "Cannot open this map link.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Map", "Cannot open this map link.");
    }
  };

  const handleDeleteCourt = (courtId) => {
    const performDelete = async () => {
      try {
        await deleteOwnerCourt(courtId);
        await loadCourts();
      } catch (error) {
        Alert.alert("Delete court failed", error?.response?.data?.message || error.message);
      }
    };

    if (Platform.OS === "web") {
      const accepted = globalThis.confirm?.("Are you sure you want to delete this court?");
      if (accepted) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Court", "Are you sure you want to delete this court?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          void performDelete();
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        let permissionResult = currentPermission;
        if (!currentPermission.granted) {
          permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }

        if (!permissionResult.granted) {
          Alert.alert("Permission required", "Please allow photo access to pick an image.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const pickedAssets = Array.isArray(result.assets) ? result.assets : [];
      if (pickedAssets.length === 0) {
        Alert.alert("Image picker", "Could not read selected image.");
        return;
      }
      const remainingSlots = Math.max(0, 8 - imageUrls.length);
      if (remainingSlots === 0) {
        Alert.alert("Image limit", "You can upload up to 8 images per court.");
        return;
      }
      const selectedAssets = pickedAssets.slice(0, remainingSlots);
      if (selectedAssets.length < pickedAssets.length) {
        Alert.alert("Image limit", "Only the first selected images were added (max 8 per court).");
      }

      setIsUploadingImage(true);
      const uploadedUrls = [];
      for (const asset of selectedAssets) {
        const uploaded = await uploadOwnerCourtImage(asset);
        const uploadedUrl = String(uploaded?.data?.url || "").trim();
        if (!uploadedUrl) {
          throw new Error("Upload succeeded but image URL is missing.");
        }
        uploadedUrls.push(uploadedUrl);
      }
      setImageUrls((prev) => {
        const merged = [...prev, ...uploadedUrls];
        return [...new Set(merged)];
      });
    } catch (error) {
      Alert.alert("Image picker failed", error?.message || "Unable to open image picker.");
    } finally {
      setIsUploadingImage(false);
    }
  };
  const handleRemoveImage = (targetUrl) => {
    setImageUrls((prev) => prev.filter((url) => url !== targetUrl));
  };
  let submitButtonLabel = "Add New Court";
  if (isSaving) {
    submitButtonLabel = "Saving...";
  } else if (editingCourtId) {
    submitButtonLabel = "Update Court";
  }
  let selectorTitle = "Select ward";
  let selectorItems = wards;
  if (activeSelector === "province") {
    selectorTitle = "Select province/city";
    selectorItems = provinces;
  } else if (activeSelector === "district") {
    selectorTitle = "Select district";
    selectorItems = districts;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {embedded ? null : <RoleTopBar onAvatarPress={() => onNavigate?.("edit-profile")} />}
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer>
          <Card>
            <View style={styles.formHeader}>
              <View style={[styles.formHeaderLeft, { backgroundColor: theme.mode === "dark" ? theme.infoSoft : "#e2e8f0" }]}>
                <Text style={[styles.formHeaderText, { color: theme.text }]}>{editingCourtId ? "Editing court" : "Create new court"}</Text>
              </View>
            </View>
            <TextInput
              placeholder="Court name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setActiveSelector("province")}
            >
              <Text style={{ color: selectedProvince?.name ? theme.text : "#9ca3af" }}>
                {selectedProvince?.name || "Province / City"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setActiveSelector("district")}
            >
              <Text style={{ color: selectedDistrict?.name ? theme.text : "#9ca3af" }}>
                {selectedDistrict?.name || "District"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setActiveSelector("ward")}
            >
              <Text style={{ color: selectedWard?.name ? theme.text : "#9ca3af" }}>
                {selectedWard?.name || "Ward"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TextInput
              placeholder="Specific address"
              placeholderTextColor="#9ca3af"
              value={addressDetail}
              onChangeText={setAddressDetail}
              autoCapitalize="sentences"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Address in English (optional)"
              placeholderTextColor="#9ca3af"
              value={addressEnglish}
              onChangeText={setAddressEnglish}
              autoCapitalize="sentences"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            {isSuggestingAddress ? <ActivityIndicator size="small" color={theme.info} style={styles.suggestionLoading} /> : null}
            {addressSuggestions.length > 0 ? (
              <View style={[styles.suggestionBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
                {addressSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.displayName}
                    style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      const firstSegment = item.displayName.split(",")[0]?.trim() || item.displayName;
                      setAddressDetail(firstSegment);
                      setAddressSuggestions([]);
                      if (Number.isFinite(item.lat) && Number.isFinite(item.lon)) {
                        setPreviewCoordinates({ lat: item.lat, lon: item.lon });
                      }
                    }}
                  >
                    <Text style={{ color: theme.textSecondary }} numberOfLines={2}>
                      {item.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {fullAddress ? (
              <View style={[styles.mapPreviewWrap, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                {Platform.OS === "web" ? (
                  <Text style={[styles.mapPreviewText, { color: theme.textSecondary }]}>
                    Map preview is available on mobile app.
                  </Text>
                ) : (
                  <WebView source={{ uri: embeddedMapUrl }} style={styles.mapWebView} />
                )}
                <TouchableOpacity
                  style={[styles.mapPickButton, { borderTopColor: theme.border }]}
                  onPress={() => {
                    setDraftCoordinates(previewCoordinates);
                    setIsMapPickerVisible(true);
                  }}
                >
                  <Ionicons name="pin-outline" size={16} color={theme.info} />
                  <Text style={[styles.mapPickButtonText, { color: theme.text }]}>Pick location on map</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput
              placeholder="Price per hour"
              placeholderTextColor="#9ca3af"
              value={pricePerHour}
              keyboardType="numeric"
              onChangeText={(value) => setPricePerHour(formatPriceInput(value))}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Contact phone"
              placeholderTextColor="#9ca3af"
              value={contactPhone}
              keyboardType="phone-pad"
              onChangeText={setContactPhone}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="00:00- 00:00"
              placeholderTextColor="#9ca3af"
              value={openingHoursMask}
              keyboardType="number-pad"
              onChangeText={(value) => {
                const key = String(lastOpeningHoursKeyRef.current || "");
                if (key === "Backspace") {
                  setOpeningHoursDigits((prev) => prev.slice(0, -1));
                  lastOpeningHoursKeyRef.current = "";
                  return;
                }
                if (/^\d$/.test(key)) {
                  setOpeningHoursDigits((prev) => (prev + key).slice(0, 8));
                  lastOpeningHoursKeyRef.current = "";
                  return;
                }
                // Allow paste/edit fallback while still keeping fixed mask.
                setOpeningHoursDigits(extractOpeningHoursDigits(value));
              }}
              onKeyPress={({ nativeEvent }) => {
                const key = String(nativeEvent?.key || "");
                lastOpeningHoursKeyRef.current = key;
              }}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Facebook link (optional)"
              placeholderTextColor="#9ca3af"
              value={facebookLink}
              onChangeText={setFacebookLink}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Zalo link (optional)"
              placeholderTextColor="#9ca3af"
              value={zaloLink}
              onChangeText={setZaloLink}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <View style={[styles.serviceEditorBox, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
              <WebView
                key={`service-editor-${editingCourtId || "new"}-${serviceEditorSeed}`}
                source={{ html: buildServiceEditorHtml(serviceEditorInitialHtml) }}
                style={styles.serviceEditorWebView}
                onMessage={(event) => {
                  try {
                    const payload = JSON.parse(String(event?.nativeEvent?.data || "{}"));
                    if (payload?.type === "change") {
                      const html = String(payload?.html || "");
                      setServiceContent(html);
                    }
                  } catch {
                    // ignore malformed editor messages
                  }
                }}
              />
            </View>
            {parsedServiceSections.length ? (
              <View style={[styles.servicePreviewWrap, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                <Text style={[styles.servicePreviewLabel, { color: theme.textSecondary }]}>Xem truoc bang dich vu</Text>
                {parsedServiceSections.map((section, sectionIndex) => {
                  const parsedTitle = parseStyledText(section.title);
                  return (
                    <View key={`${section.title}-${sectionIndex}`} style={[styles.servicePreviewCard, { borderColor: theme.border }]}>
                      <Text style={[styles.servicePreviewTitle, { color: parsedTitle.style.color || theme.text, textAlign: parsedTitle.style.textAlign, fontSize: parsedTitle.style.fontSize, fontWeight: parsedTitle.style.fontWeight, fontStyle: parsedTitle.style.fontStyle }]}>
                        {parsedTitle.text}
                      </Text>
                      {section.rows.map((row, rowIndex) => {
                        const parsedName = parseStyledText(row.name);
                        const parsedPrice = parseStyledText(row.price);
                        return (
                          <View key={`${sectionIndex}-${rowIndex}`} style={[styles.servicePreviewRow, rowIndex === section.rows.length - 1 ? styles.servicePreviewRowLast : null, { borderBottomColor: theme.border }]}>
                            <Text
                              style={[
                                styles.servicePreviewName,
                                {
                                  color: parsedName.style.color || theme.text,
                                  textAlign: parsedName.style.textAlign,
                                  fontSize: parsedName.style.fontSize,
                                  fontWeight: parsedName.style.fontWeight,
                                  fontStyle: parsedName.style.fontStyle,
                                },
                              ]}
                            >
                              {parsedName.text}
                            </Text>
                            <Text
                              style={[
                                styles.servicePreviewPrice,
                                {
                                  color: parsedPrice.style.color || theme.text,
                                  textAlign: parsedPrice.style.textAlign,
                                  fontSize: parsedPrice.style.fontSize,
                                  fontWeight: parsedPrice.style.fontWeight,
                                  fontStyle: parsedPrice.style.fontStyle,
                                },
                              ]}
                            >
                              {parsedPrice.text}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            ) : hasHtmlServiceContent ? (
              <View style={[styles.servicePreviewWrap, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                <Text style={[styles.servicePreviewLabel, { color: theme.textSecondary }]}>Xem truoc bang dich vu</Text>
                <WebView source={{ html: buildServicePreviewHtml(serviceContent) }} style={styles.servicePreviewWebView} />
              </View>
            ) : null}
            <View style={[styles.imageBox, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
              {imageUrls.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollContent}>
                  {imageUrls.map((url) => (
                    <View key={url} style={styles.imageThumbWrap}>
                      <Image source={{ uri: url }} style={styles.previewImage} resizeMode="cover" />
                      <TouchableOpacity onPress={() => handleRemoveImage(url)} style={[styles.clearIconButton, { backgroundColor: theme.card }]}>
                        <Ionicons name="close" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyImageState}>
                  <Text style={[styles.emptyImageText, { color: theme.textSecondary }]}>No image selected</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.imagePickerButton, { borderColor: theme.border, backgroundColor: theme.card }]}
              disabled={isUploadingImage}
            >
              <Ionicons name="images-outline" size={18} color={theme.info} />
              <Text style={[styles.imagePickerText, { color: theme.text }]}>
                {isUploadingImage ? "Uploading..." : "Pick image(s)"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.imageHint, { color: theme.textSecondary }]}>
              {isUploadingImage
                ? "Uploading selected image(s) to server..."
                : "You can select multiple images. These URLs are shared for both web and mobile."}
            </Text>
            <GradientButton
              label={submitButtonLabel}
              onPress={handleSaveCourt}
            />
            {editingCourtId ? <GradientButton label="Cancel Edit" onPress={resetForm} style={styles.secondaryButton} /> : null}
          </Card>

          {isLoading ? <ActivityIndicator size="large" color={theme.info} /> : null}
          {!isLoading &&
            courts.map((court) => {
              const favoriteKey = String(court.id || "");
              const hasOverride = Object.hasOwn(favoriteOverrides, favoriteKey);
              const isFavorite = hasOverride ? Boolean(favoriteOverrides[favoriteKey]) : false;
              return (
                <CourtCard
                key={court.id}
                name={court.name}
                location={
                  language === "en"
                    ? court.locationEn || court.locationVi || court.location
                    : court.locationVi || court.location || court.locationEn
                }
                mapUrl={court.mapUrl}
                price={formatVNDPerHour(court.pricePerHour)}
                imageUrls={Array.isArray(court.images) ? court.images : []}
                imageUrl={
                  (Array.isArray(court.images) && court.images[0]) ||
                  court.imageUrl ||
                  court.image ||
                  ""
                }
                isFavorite={isFavorite}
                onToggleFavorite={() => onFavoriteStateChange?.(favoriteKey, !isFavorite)}
                primaryActionLabel="XEM CHI TIẾT"
                onPrimaryAction={() => onOpenCourt?.(court.id)}
                onPress={() => onOpenCourt?.(court.id)}
                actions={[
                  { label: "Map", onPress: () => handleOpenMap(court) },
                  { label: "Edit", onPress: () => handleEditCourt(court) },
                  { label: "Delete", type: "danger", onPress: () => handleDeleteCourt(court.id) },
                ]}
              />
              );
            })}
        </ScreenContainer>
      </KeyboardAvoidingView>
      <Modal visible={isMapPickerVisible} transparent animationType="fade" onRequestClose={() => setIsMapPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.mapPickerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select pinned location</Text>
              <TouchableOpacity onPress={() => setIsMapPickerVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <WebView
              key={`map-picker-${initialPickerLat}-${initialPickerLon}-${pickerZoomLevel}`}
              source={{ html: mapPickerHtml }}
              style={styles.mapPickerWebView}
              onMessage={(event) => {
                try {
                  const payload = JSON.parse(String(event?.nativeEvent?.data || "{}"));
                  if (payload?.type === "picked" && Number.isFinite(payload?.lat) && Number.isFinite(payload?.lon)) {
                    setDraftCoordinates({ lat: payload.lat, lon: payload.lon });
                  }
                } catch {
                  // ignore malformed bridge messages
                }
              }}
            />
            <View style={styles.mapPickerFooter}>
              <TouchableOpacity style={styles.mapPickerCancel} onPress={() => setIsMapPickerVisible(false)}>
                <Text style={[styles.mapPickerCancelText, { color: theme.textSecondary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapPickerConfirm, { backgroundColor: theme.info }]}
                onPress={async () => {
                  if (!draftCoordinates || !Number.isFinite(draftCoordinates.lat) || !Number.isFinite(draftCoordinates.lon)) {
                    setIsMapPickerVisible(false);
                    return;
                  }
                  setIsResolvingPinnedAddress(true);
                  try {
                    setPreviewCoordinates(draftCoordinates);
                    const resolvedDetail = await reverseGeocodeCoordinates(draftCoordinates);
                    if (resolvedDetail) {
                      setAddressDetail(resolvedDetail);
                    }
                  } catch {
                    // Keep existing address detail if reverse geocode fails.
                  } finally {
                    setIsResolvingPinnedAddress(false);
                    setIsMapPickerVisible(false);
                  }
                }}
                disabled={isResolvingPinnedAddress}
              >
                <Text style={styles.mapPickerConfirmText}>{isResolvingPinnedAddress ? "Confirming..." : "Confirm"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(activeSelector)} transparent animationType="fade" onRequestClose={() => setActiveSelector(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectorTitle}</Text>
              <TouchableOpacity onPress={() => setActiveSelector(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {isAddressLoading ? <ActivityIndicator size="small" color={theme.info} /> : null}
            <ScrollView style={styles.modalList}>
              {selectorItems.map((item) => (
                <TouchableOpacity
                  key={String(item.code)}
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    if (activeSelector === "province") {
                      setSelectedProvince(item);
                      setSelectedDistrict(null);
                      setSelectedWard(null);
                    } else if (activeSelector === "district") {
                      setSelectedDistrict(item);
                      setSelectedWard(null);
                    } else {
                      setSelectedWard(item);
                    }
                    setActiveSelector(null);
                  }}
                >
                  <Text style={{ color: theme.text }}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  formHeader: { marginBottom: 8 },
  formHeaderLeft: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#e2e8f0" },
  formHeaderText: { fontSize: 12, fontWeight: "700", padding: 0 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  selectInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggestionLoading: { marginTop: -4, marginBottom: 8 },
  suggestionBox: { borderWidth: 1, borderRadius: 10, marginBottom: 10, overflow: "hidden" },
  suggestionItem: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  mapPreviewWrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  mapWebView: { width: "100%", height: 190, backgroundColor: "#e5e7eb" },
  mapPreviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mapPreviewText: { fontWeight: "600" },
  mapPickButton: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mapPickButtonText: { fontWeight: "700" },
  mapPickerCard: {
    width: "100%",
    maxWidth: 720,
    height: "78%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  mapPickerWebView: { width: "100%", flex: 1, borderRadius: 10, overflow: "hidden" },
  mapPickerFooter: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 10 },
  mapPickerCancel: { paddingHorizontal: 8, paddingVertical: 8 },
  mapPickerCancelText: { fontWeight: "600" },
  mapPickerConfirm: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  mapPickerConfirmText: { color: colors.white, fontWeight: "700" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  serviceEditorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  serviceEditorWebView: { width: "100%", height: 330, backgroundColor: "transparent" },
  servicePreviewWrap: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  servicePreviewLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  servicePreviewCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  servicePreviewTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  servicePreviewRow: {
    minHeight: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  servicePreviewRowLast: { borderBottomWidth: 0 },
  servicePreviewName: { flex: 1, fontSize: 14, fontWeight: "600" },
  servicePreviewPrice: { fontSize: 14, fontWeight: "600" },
  servicePreviewWebView: { width: "100%", height: 220, backgroundColor: "transparent" },
  imageBox: {
    width: "100%",
    minHeight: 150,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
    padding: 8,
  },
  imageScrollContent: { gap: 10, paddingRight: 4 },
  imageThumbWrap: {
    width: 160,
    height: 130,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  emptyImageState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyImageText: { fontSize: 13 },
  imageHint: { marginBottom: 10, fontSize: 12, marginTop: 6 },
  previewImage: { width: "100%", height: "100%", borderRadius: 10 },
  imagePickerButton: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickerText: { fontSize: 14, fontWeight: "700" },
  clearIconButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalList: { maxHeight: 360 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1 },
  secondaryButton: { marginTop: 8, opacity: 0.7 },
});
