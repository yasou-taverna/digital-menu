/**
 * order-queue.js
 * שכבת ה-offline queue - שומרת הזמנות ב-localStorage של המכשיר עד שהן נשלחות בהצלחה.
 * תלוי ב-api.js (apiSubmitOrder). נטען לפני order.html.
 *
 * שימוש (ב-order.html):
 *   OrderQueue.add(order);                          // שומר מקומית + מנסה לשלוח
 *   OrderQueue.onCountChange(count => ...);          // callback לעדכון תג "X ממתינות"
 *   window.addEventListener("online", OrderQueue.flush);
 *   setInterval(OrderQueue.flush, 15000);
 */
const OrderQueue = (() => {
  const QUEUE_KEY = "yasou_order_queue";
  let countChangeCallback = null;

  function loadQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    if (countChangeCallback) countChangeCallback(queue.length);
  }

  function generateOrderId(table) {
    return "ord_" + table + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  }

  // מוסיף הזמנה לתור המקומי ומיד מנסה לשלוח אותה
  function add(order) {
    const queue = loadQueue();
    queue.push(order);
    saveQueue(queue);
    flush();
  }

  // מנסה לשלוח את כל ההזמנות שממתינות בתור. הזמנות שנכשלו נשארות לניסיון הבא.
  async function flush() {
    let queue = loadQueue();
    if (queue.length === 0) return;
    const stillPending = [];
    for (const order of queue) {
      const sent = await apiSubmitOrder(order);
      if (!sent) stillPending.push(order);
    }
    saveQueue(stillPending);
    return stillPending.length === 0; // true אם הכל סונכרן בהצלחה
  }

  function pendingCount() {
    return loadQueue().length;
  }

  function onCountChange(callback) {
    countChangeCallback = callback;
  }

  return { add, flush, pendingCount, onCountChange, generateOrderId };
})();
