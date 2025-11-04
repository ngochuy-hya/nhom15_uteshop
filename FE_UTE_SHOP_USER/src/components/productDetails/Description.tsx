import React from "react";

export default function Description({ product }: { product?: any }) {
  // Lấy description từ product, nếu không có thì dùng default
  const description = product?.description || product?.short_description || '';
  
  // Lấy material từ attributes
  const materialAttributes = product?.attributes?.filter((attr: any) => 
    attr.attribute_type === 'material' && attr.is_active
  ) || [];

  return (
    <>
      {description && (
        <div className="item">
          <div dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br />') }} />
        </div>
      )}
      
      {product?.short_description && product.short_description !== description && (
        <div className="item">
          <p className="fw-medium title">Mô tả ngắn</p>
          <p>{product.short_description}</p>
        </div>
      )}

      {materialAttributes.length > 0 && (
        <div className="item">
          <p className="fw-medium title">Thành phần / Chất liệu</p>
          <ul>
            {materialAttributes.map((attr: any, index: number) => (
              <li key={index}>{attr.attribute_value}</li>
            ))}
          </ul>
        </div>
      )}

      {!description && !product?.short_description && (
        <div className="item">
          <p>Không có mô tả sản phẩm.</p>
        </div>
      )}
    </>
  );
}

