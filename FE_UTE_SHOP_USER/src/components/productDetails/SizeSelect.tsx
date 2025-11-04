"use client";
import { useState, useEffect } from "react";

const defaultSizes = [
  { label: "S", value: "small", display: "Small" },
  { label: "M", value: "medium", display: "Medium" },
  { label: "L", value: "large", display: "Large" },
  { label: "XL", value: "extra large", display: "Extra Large" },
];

const SizePicker = ({ sizes: propSizes }: { sizes?: string[] }) => {
  // Map propSizes (string array) sang format cần thiết
  const mappedSizes = propSizes && propSizes.length > 0
    ? propSizes.map((size) => {
        const sizeLower = size.toLowerCase();
        return {
          label: size.toUpperCase(),
          value: sizeLower,
          display: size.charAt(0).toUpperCase() + size.slice(1),
        };
      })
    : defaultSizes;

  const [currentSize, setCurrentSize] = useState(mappedSizes[0]?.display || "Small");
  const [activeSize, setActiveSize] = useState(mappedSizes[0]?.value || "small");

  useEffect(() => {
    if (mappedSizes.length > 0) {
      setCurrentSize(mappedSizes[0].display);
      setActiveSize(mappedSizes[0].value);
    }
  }, [JSON.stringify(propSizes)]);

  const handleSizeClick = (size) => {
    setActiveSize(size.value);
    setCurrentSize(size.display);
  };

  return (
    <div className="variant-picker-item variant-size">
      <div className="variant-picker-label">
        <div>
          Size:
          <span className="variant-picker-label-value value-currentSize">
            {currentSize}
          </span>
        </div>
        <a href="#sizeGuide" data-bs-toggle="modal" className="size-guide link">
          Size Guide
        </a>
      </div>
      <div className="variant-picker-values">
        {mappedSizes.map((size) => (
          <span
            key={size.value}
            className={`size-btn ${activeSize === size.value ? "active" : ""}`}
            data-size={size.value}
            onClick={() => handleSizeClick(size)}
          >
            {size.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SizePicker;

