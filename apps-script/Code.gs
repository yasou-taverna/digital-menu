

const SHEET_NAME = "Orders";

// ---------- הגדרת עמודות הגיליון ----------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.clear();
  sheet.appendRow([
    "מזהה הזמנה (orderId)",
    "שולחן",
    "פריטים (טקסט)",
    "פריטים (JSON גולמי)",
    "סה\"כ (€)",
    "שעת שליחה",
    "סטטוס"
  ]);
  sheet.setFrozenRows(1);
}

// ---------- קבלת הזמנה חדשה מהמלצר (POST) ----------
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // idempotency - אם orderId כבר קיים בגיליון, לא כותבים שוב (מונע כפילויות מרשת לא יציבה)
    if (orderAlreadyExists(data.orderId)) {
      return jsonResponse({ ok: true, duplicate: true, orderId: data.orderId });
    }

    const itemsText = (data.items || [])
      .map(it => `${it.qty}x ${it.name}${it.variantLabel ? " (" + it.variantLabel + ")" : ""}${it.note ? " – " + it.note : ""}`)
      .join("\n");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    sheet.appendRow([
      data.orderId,
      data.table,
      itemsText,
      JSON.stringify(data.items),
      data.total,
      new Date(),
      "חדש"
    ]);

    return jsonResponse({ ok: true, orderId: data.orderId });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function orderAlreadyExists(orderId) {
  if (!orderId) return false;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues().flat();
  return ids.includes(orderId);
}

// ---------- קריאת הזמנות פתוחות (GET) - לשימוש עתידי בעמוד קופה חי ----------
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift();
    const orders = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    return jsonResponse({ ok: true, orders });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


