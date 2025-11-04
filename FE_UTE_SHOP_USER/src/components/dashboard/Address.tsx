"use client";
import React, { useEffect, useState } from "react";
import { addressService } from "@/services";
import Sidebar from "./Sidebar";

export default function Address() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Việt Nam",
    is_default: 0,
  });

  // ================== LOAD DATA ==================
  useEffect(() => {
    (async () => {
      try {
        const data = await addressService.getAddresses();
        setAddresses(data);
      } catch (err) {
        console.error("Không thể tải danh sách địa chỉ:", err);
      }
    })();
  }, []);

  // ================== FORM HANDLERS ==================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  // ================== ADD ==================
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await addressService.createAddress(newAddress);
      setAddresses((prev) => [...prev, added]);
      setShowAddForm(false);
      setNewAddress({
        full_name: "",
        phone: "",
        address_line1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Việt Nam",
        is_default: 0,
      });
    } catch (err) {
      console.error("Không thể thêm địa chỉ:", err);
    }
  };

  // ================== EDIT ==================
  const handleEditAddress = (id: number) => {
    setEditingAddressId(id);
    const a = addresses.find((x) => x.id === id);
    if (a) setNewAddress({ ...a });
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressId) return;
    try {
      const updated = await addressService.updateAddress(
        editingAddressId,
        newAddress
      );
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingAddressId ? updated : a))
      );
      setEditingAddressId(null);
    } catch (err) {
      console.error("Không thể cập nhật địa chỉ:", err);
    }
  };

  // ================== DELETE ==================
  const handleDeleteAddress = async (id: number) => {
    try {
      await addressService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Không thể xoá địa chỉ:", err);
    }
  };

  // ================== DEFAULT ==================
  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id ? 1 : 0 }))
      );
    } catch (err) {
      console.error("Không thể đặt mặc định:", err);
    }
  };

  // ================== CANCEL ==================
  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setNewAddress({
      full_name: "",
      phone: "",
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Việt Nam",
      is_default: 0,
    });
  };

  // ================== RENDER ==================
  return (
    <div className="flat-spacing-13">
      <div className="container-7">
        <div className="btn-sidebar-mb d-lg-none">
          <button data-bs-toggle="offcanvas" data-bs-target="#mbAccount">
            <i className="icon icon-sidebar" />
          </button>
        </div>

        {/* Account layout */}
        <div className="main-content-account">
          <div className="sidebar-account-wrap sidebar-content-wrap sticky-top d-lg-block d-none">
            <ul className="my-account-nav">
              <Sidebar />
            </ul>
          </div>

          <div className="my-acount-content account-address">
            <h6 className="title-account">
              Your addresses ({addresses.length})
            </h6>

            <div className="widget-inner-address">
              <button
                className="tf-btn btn-add-address animate-btn"
                onClick={() => setShowAddForm(true)}
              >
                Add new address
              </button>

              {/* ========== ADD FORM ========== */}
              {showAddForm && (
                <form
                  onSubmit={handleAddAddress}
                  className="wd-form-address form-default show-form-address"
                  style={{ display: "block" }}
                >
                  <div className="cols">
                    <fieldset>
                      <label htmlFor="full_name">Full Name</label>
                      <input
                        type="text"
                        id="full_name"
                        value={newAddress.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                    <fieldset>
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="text"
                        id="phone"
                        value={newAddress.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="address_line1">Address</label>
                      <input
                        type="text"
                        id="address_line1"
                        value={newAddress.address_line1}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        value={newAddress.city}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="state">State</label>
                      <input
                        type="text"
                        id="state"
                        value={newAddress.state}
                        onChange={handleInputChange}
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="postal_code">Postal Code</label>
                      <input
                        type="text"
                        id="postal_code"
                        value={newAddress.postal_code}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="tf-cart-checkbox">
                    <input
                      type="checkbox"
                      name="is_default"
                      className="tf-check"
                      id="is_default"
                      checked={!!newAddress.is_default}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_default" className="label">
                      <span>Set as default address</span>
                    </label>
                  </div>

                  <div className="box-btn">
                    <button className="tf-btn animate-btn" type="submit">
                      Add Address
                    </button>
                    <button
                      type="button"
                      className="tf-btn btn-out-line-dark btn-hide-address"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* ========== ADDRESS LIST ========== */}
              <ul className="list-account-address tf-grid-layout md-col-2">
                {addresses.map((a, i) => (
                  <li className="account-address-item" key={i}>
                    <p className="title text-md fw-medium">{a.address_line1}</p>
                    <div className="info-detail">
                      <div className="box-infor">
                        <p className="text-md">{a.full_name}</p>
                        <p className="text-md">{a.phone}</p>
                        <p className="text-md">{a.address_line1}</p>
                        <p className="text-md">
                          {a.city}, {a.state}
                        </p>
                        <p className="text-md">{a.postal_code}</p>
                        <p className="text-md">
                          Default Address: {a.is_default ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="box-btn">
                        <button
                          className="tf-btn btn-out-line-dark btn-edit-address"
                          onClick={() => handleEditAddress(a.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="tf-btn btn-out-line-dark btn-delete-address"
                          onClick={() => handleDeleteAddress(a.id)}
                        >
                          Delete
                        </button>
                        {!a.is_default && (
                          <button
                            className="tf-btn btn-out-line-dark"
                            onClick={() => handleSetDefault(a.id)}
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* ========== EDIT FORM ========== */}
              {editingAddressId !== null && (
                <form
                  onSubmit={handleUpdateAddress}
                  className="wd-form-address form-default edit-form-address"
                  style={{ display: "block" }}
                >
                  <div className="cols">
                    <fieldset>
                      <label htmlFor="full_name">Full Name</label>
                      <input
                        type="text"
                        id="full_name"
                        value={newAddress.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                    <fieldset>
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="text"
                        id="phone"
                        value={newAddress.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="address_line1">Address</label>
                      <input
                        type="text"
                        id="address_line1"
                        value={newAddress.address_line1}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        value={newAddress.city}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="state">State</label>
                      <input
                        type="text"
                        id="state"
                        value={newAddress.state}
                        onChange={handleInputChange}
                      />
                    </fieldset>
                  </div>

                  <div className="cols">
                    <fieldset>
                      <label htmlFor="postal_code">Postal Code</label>
                      <input
                        type="text"
                        id="postal_code"
                        value={newAddress.postal_code}
                        onChange={handleInputChange}
                        required
                      />
                    </fieldset>
                  </div>

                  <div className="tf-cart-checkbox">
                    <input
                      type="checkbox"
                      name="is_default"
                      className="tf-check"
                      id="is_default"
                      checked={!!newAddress.is_default}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_default" className="label">
                      <span>Set as default address</span>
                    </label>
                  </div>

                  <div className="box-btn">
                    <button className="tf-btn animate-btn" type="submit">
                      Update
                    </button>
                    <button
                      type="button"
                      className="tf-btn btn-out-line-dark btn-hide-edit-address"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
