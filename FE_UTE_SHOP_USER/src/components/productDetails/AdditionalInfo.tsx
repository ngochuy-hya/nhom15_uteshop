import React from "react";

export default function AdditionalInfo({ product }: { product?: any }) {
  // Lấy các attributes từ product
  const colors = product?.attributes?.filter((attr: any) => 
    attr.attribute_type === 'color' && attr.is_active
  ).map((attr: any) => attr.attribute_value).join(', ') || '';

  const sizes = product?.attributes?.filter((attr: any) => 
    attr.attribute_type === 'size' && attr.is_active
  ).map((attr: any) => attr.attribute_value).join(', ') || '';

  const materials = product?.attributes?.filter((attr: any) => 
    attr.attribute_type === 'material' && attr.is_active
  ).map((attr: any) => attr.attribute_value).join(', ') || '';

  const styles = product?.attributes?.filter((attr: any) => 
    attr.attribute_type === 'style' && attr.is_active
  ).map((attr: any) => attr.attribute_value).join(', ') || '';

  return (
    <table className="tb-info-product text-md">
      <tbody>
        {product?.sku && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">SKU</th>
            <td className="tb-attr-value">
              <p>{product.sku}</p>
            </td>
          </tr>
        )}
        {product?.brand_name && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Brand</th>
            <td className="tb-attr-value">
              <p>{product.brand_name}</p>
            </td>
          </tr>
        )}
        {product?.category_name && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Category</th>
            <td className="tb-attr-value">
              <p>{product.category_name}</p>
            </td>
          </tr>
        )}
        {materials && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Material</th>
            <td className="tb-attr-value">
              <p>{materials}</p>
            </td>
          </tr>
        )}
        {colors && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Color</th>
            <td className="tb-attr-value">
              <p>{colors}</p>
            </td>
          </tr>
        )}
        {sizes && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Size</th>
            <td className="tb-attr-value">
              <p>{sizes}</p>
            </td>
          </tr>
        )}
        {styles && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Style</th>
            <td className="tb-attr-value">
              <p>{styles}</p>
            </td>
          </tr>
        )}
        {product?.weight && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Weight</th>
            <td className="tb-attr-value">
              <p>{product.weight} kg</p>
            </td>
          </tr>
        )}
        {product?.dimensions && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Dimensions</th>
            <td className="tb-attr-value">
              <p>{product.dimensions}</p>
            </td>
          </tr>
        )}
        {product?.gender && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Gender</th>
            <td className="tb-attr-value">
              <p>{product.gender.charAt(0).toUpperCase() + product.gender.slice(1)}</p>
            </td>
          </tr>
        )}
        {product?.season && product.season !== 'all' && (
          <tr className="tb-attr-item">
            <th className="tb-attr-label">Season</th>
            <td className="tb-attr-value">
              <p>{product.season.charAt(0).toUpperCase() + product.season.slice(1)}</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

