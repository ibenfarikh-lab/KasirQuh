/* KasirQuh Phase 15 - extracted Admin UI notification module. */
    // Notifikasi pelanggan baru: badge realtime pada tab Persetujuan Pelanggan.
    (function initPendingCustomerNotification() {
      let firstSnapshot = true;
      let previousPendingCount = 0;

      function updatePendingCustomerBadge(count) {
        const badge = document.getElementById("pending-customer-badge");
        if (!badge) return;
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.style.display = "inline-block";
        } else {
          badge.textContent = "";
          badge.style.display = "none";
        }
      }

      function startListener() {
        if (typeof db === "undefined" || !db.collection) return;

        storeCollection("pelanggan").onSnapshot((snapshot) => {
          let pendingCount = 0;
          snapshot.forEach((doc) => {
            const data = doc.data() || {};
            if (String(data.status || "").toLowerCase() === "pending") pendingCount++;
          });

          updatePendingCustomerBadge(pendingCount);

          if (!firstSnapshot && pendingCount > previousPendingCount) {
            if (typeof playNotificationSound === "function") playNotificationSound();
            if (typeof showNotif === "function") showNotif("🔔 Ada pelanggan baru menunggu persetujuan!");
          }

          previousPendingCount = pendingCount;
          firstSnapshot = false;
        }, (err) => {
          console.warn("Gagal memantau persetujuan pelanggan:", err);
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startListener);
      } else {
        startListener();
      }
    })();
  
