"use client";
import React from "react";

interface QuantitySelectProps {
  quantity: number;
  setQuantity: (value: number) => void; // 👈 hàm nhận 1 tham số number
  styleClass?: string;
}

export default function QuantitySelect({
  quantity = 1,
  setQuantity,
  styleClass = "",
}: QuantitySelectProps) {
  return (
    <div className={`wg-quantity ${styleClass}`}>
      {/* Nút giảm số lượng */}
      <button
        className="btn-quantity minus-btn"
        onClick={() => setQuantity(quantity > 1 ? quantity - 1 : quantity)}
        type="button"
      >
        -
      </button>

      {/* Ô nhập số lượng */}
      <input
        className="quantity-product font-4"
        type="number"
        name="number"
        value={quantity}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          if (!isNaN(value) && value > 0) {
            setQuantity(value);
          }
        }}
      />

      {/* Nút tăng số lượng */}
      <span
        className="btn-quantity plus-btn"
        onClick={() => setQuantity(quantity + 1)}
        role="button"
        tabIndex={0}
      >
        +
      </span>
    </div>
  );
}
