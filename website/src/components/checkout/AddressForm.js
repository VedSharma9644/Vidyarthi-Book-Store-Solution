import React, { useState } from 'react';
import { colors } from '../../css/checkoutStyles';
import { borderRadius } from '../../css/theme';
import { digitsOnlyPhone, toTenDigitPhone } from '../../utils/phone';

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '12px 16px',
  fontSize: '16px',
  border: `1px solid ${hasError ? '#ef4444' : colors.borderLight}`,
  borderRadius: borderRadius.md,
  backgroundColor: colors.white,
  color: colors.textPrimary,
  boxSizing: 'border-box',
});

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: colors.textPrimary,
  marginBottom: '8px',
};

const AddressForm = ({
  address,
  onSave,
  onCancel,
  isEditing = false,
  includeStudentFields = false,
  defaultPhone = '',
}) => {
  const [formData, setFormData] = useState({
    name: address?.name || '',
    phone: toTenDigitPhone(address?.phone || defaultPhone || ''),
    alternativeMobile: toTenDigitPhone(address?.alternativeMobile || ''),
    studentName: address?.studentName || '',
    studentRollNumber: address?.studentRollNumber || '',
    address: address?.address || '',
    landmark: address?.landmark || '',
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.postalCode || '',
    country: address?.country || 'India',
    isDefault: address?.isDefault || false,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (
      formData.alternativeMobile.trim() &&
      !/^[0-9]{10}$/.test(formData.alternativeMobile.trim())
    ) {
      newErrors.alternativeMobile = 'Please enter a valid 10-digit alternative mobile number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Pin Code is required';
    } else if (!/^[0-9]{6}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = 'Please enter a valid 6-digit Pin Code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        ...formData,
        phone: toTenDigitPhone(formData.phone),
        alternativeMobile: toTenDigitPhone(formData.alternativeMobile),
        landmark: formData.landmark.trim(),
      };
      if (!includeStudentFields) {
        delete payload.studentName;
        delete payload.studentRollNumber;
      }
      onSave(payload);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={labelStyle}>
          Full Name <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          style={inputStyle(!!errors.name)}
          placeholder="Enter full name"
        />
        {errors.name && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>
          Phone Number <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', digitsOnlyPhone(e.target.value))}
          maxLength={10}
          inputMode="numeric"
          style={inputStyle(!!errors.phone)}
          placeholder="10-digit mobile number"
        />
        {errors.phone && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Alternative Mobile Number</label>
        <input
          type="tel"
          value={formData.alternativeMobile}
          onChange={(e) => handleChange('alternativeMobile', digitsOnlyPhone(e.target.value))}
          maxLength={10}
          inputMode="numeric"
          style={inputStyle(!!errors.alternativeMobile)}
          placeholder="Optional 10-digit mobile number"
        />
        {errors.alternativeMobile && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
            {errors.alternativeMobile}
          </p>
        )}
      </div>

      {includeStudentFields ? (
        <>
          <div>
            <label style={labelStyle}>Student Name</label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => handleChange('studentName', e.target.value)}
              style={inputStyle(false)}
              placeholder="Enter student name (optional)"
            />
          </div>

          <div>
            <label style={labelStyle}>Student Roll Number</label>
            <input
              type="text"
              value={formData.studentRollNumber}
              onChange={(e) => handleChange('studentRollNumber', e.target.value)}
              style={inputStyle(false)}
              placeholder="Enter student roll number (optional)"
            />
          </div>
        </>
      ) : null}

      <div>
        <label style={labelStyle}>
          Street Address <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          rows={3}
          style={{
            ...inputStyle(!!errors.address),
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
          placeholder="Enter street address, building, apartment, etc."
        />
        {errors.address && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
            {errors.address}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Landmark</label>
        <input
          type="text"
          value={formData.landmark}
          onChange={(e) => handleChange('landmark', e.target.value)}
          style={inputStyle(false)}
          placeholder="Nearby landmark (optional)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>
            City <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            style={inputStyle(!!errors.city)}
            placeholder="Enter city"
          />
          {errors.city && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.city}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            State <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            style={inputStyle(!!errors.state)}
            placeholder="Enter state"
          />
          {errors.state && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.state}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>
            Pin Code <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            name="pinCode"
            autoComplete="postal-code"
            aria-label="Pin Code"
            value={formData.postalCode}
            onChange={(e) => handleChange('postalCode', digitsOnlyPhone(e.target.value, 6))}
            maxLength={6}
            inputMode="numeric"
            style={inputStyle(!!errors.postalCode)}
            placeholder="Enter 6-digit Pin Code"
          />
          {errors.postalCode && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {errors.postalCode}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            style={inputStyle(false)}
            placeholder="Enter country"
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => handleChange('isDefault', e.target.checked)}
          style={{
            width: '20px',
            height: '20px',
            cursor: 'pointer',
          }}
        />
        <label
          htmlFor="isDefault"
          style={{
            fontSize: '14px',
            color: colors.textPrimary,
            cursor: 'pointer',
          }}
        >
          Set as default address
        </label>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '14px 24px',
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#053080';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          {isEditing ? 'Update Address' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '14px 24px',
            backgroundColor: 'transparent',
            color: colors.textSecondary,
            border: `1px solid ${colors.borderLight}`,
            borderRadius: borderRadius.md,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray50;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
