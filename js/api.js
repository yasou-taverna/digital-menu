/**
 * api.js
 * שכבת תקשורת יחידה מול ה-Apps Script backend (Code.gs).
 * נטען לפני order-queue.js, order.html, ו-kitchen.html.
 *
 * הערה חשובה: השליחה היא GET (לא POST) בכוונה - כי בקשות POST ל-Apps Script
 * Web App עוברות הפניה (302) שהדפדפן ממיר אוטומטית ל-GET, ומאבד את גוף הבקשה.
 * GET לא סובל מהבעיה הזו כי הוא נשאר GET גם אחרי ההפניה.
 */

// TODO: לעדכן בכל פעם שיוצרים deployment חדש ב-Apps Script (Deploy > Manage deployments)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby79Qn4B8GpDqhXsL5e2fxCcngzzRyVfG-sKzPnMvsDinjpNs5KyCcMtZVf4mcFoYJ9/exec";

/**
 * שולח הזמנה בודדת לשרת.
 * מחזיר true אם ה-fetch לא זרק שגיאה (כלומר יש רשת ושרת הגיב),
 * false אם אין רשת/השרת לא זמין. לא ניתן לקרוא את תוכן התשובה בגלל no-cors.
 */
async function apiSubmitOrder(order) {
  try {
    const url = APPS_SCRIPT_URL + "?action=submit&data=" + encodeURIComponent(JSON.stringify(order));
    await fetch(url, { method: "GET", mode: "no-cors" });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * שולף את רשימת ההזמנות הקיימות בגיליון (לשימוש ב-kitchen.html).
 * זורק שגיאה אם הבקשה נכשלה - יש לתפוס עם try/catch בצד הקורא.
 */
async function apiFetchOrders() {
  const res = await fetch(APPS_SCRIPT_URL, { method: "GET" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "שגיאה לא ידועה מהשרת");
  return data.orders || [];
}

