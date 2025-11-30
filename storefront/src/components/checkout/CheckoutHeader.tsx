"use client";

import React from "react";

type Props = {
  storeName?: string;
  logoUrl?: string;
};

const CheckoutHeader: React.FC<Props> = ({ storeName = "Checkout", logoUrl }) => {
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!logoUrl) return;
    const img = new Image();
    img.src = logoUrl;
    const onLoad = () => setLogoLoaded(true);
    const onError = () => setLogoLoaded(false);
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };
  }, [logoUrl]);

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && logoLoaded ? (
            <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
              {storeName?.charAt(0) || "C"}
            </div>
          )}
          {(!logoUrl || !logoLoaded) && (
            <span className="text-gray-900 font-semibold text-base">
              {storeName}
            </span>
          )}
        </div>

        {/* Trust area with only Visa and Mastercard logos */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/trust/visa.svg" alt="Visa" className="h-5 w-auto" />
            <img src="/trust/mastercard.svg" alt="Mastercard" className="h-5 w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutHeader;
