// FILE: student-app/src/api/paymentScripts.ts

// src/api/paymentScripts.ts
declare global {
  interface Window {
    Razorpay: any;
    Cashfree: any;
  }
}

const loadScript = (src: string, isLoaded: () => boolean) =>
  new Promise<boolean>((resolve) => {
    if (isLoaded()) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const loadRazorpayScript = () =>
  loadScript("https://checkout.razorpay.com/v1/checkout.js", () => !!window.Razorpay);

export const loadCashfreeScript = () =>
  loadScript("https://sdk.cashfree.com/js/v3/cashfree.js", () => !!window.Cashfree);

// Flip to "sandbox" while testing with Cashfree test keys.
export const CASHFREE_MODE = "production";
