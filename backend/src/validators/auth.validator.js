/**
 * Auth Validators
 * Validate request data before processing
 */

export const validateSignup = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLogin = (data) => {
  const errors = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateChangePassword = (data) => {
  const errors = [];

  if (!data.currentPassword) {
    errors.push('Current password is required');
  }

  if (!data.newPassword) {
    errors.push('New password is required');
  } else if (data.newPassword.length < 6) {
    errors.push('New password must be at least 6 characters');
  }

  if (data.currentPassword === data.newPassword) {
    errors.push('New password must be different from current password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUpdateProfile = (data) => {
  const errors = [];

  if (data.fullName !== undefined) {
    if (typeof data.fullName !== 'string') {
      errors.push('Full name must be a string');
    } else if (data.fullName.trim().length < 2 || data.fullName.trim().length > 100) {
      errors.push('Full name must be between 2 and 100 characters');
    }
  }

  if (data.phoneNumber !== undefined && data.phoneNumber !== null && data.phoneNumber !== '') {
    if (!/^[0-9+\-() ]*$/.test(data.phoneNumber)) {
      errors.push('Invalid phone number format');
    }
  }t

  if (data.avatar !== undefined && data.avatar !== null && data.avatar !== '') {
    try {
      new URL(data.avatar);
    } catch {
      errors.push('Avatar mus be a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateForgotPassword = (data) => {
  const errors = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateResetPassword = (data) => {
  const errors = [];

  if (!data.token || typeof data.token !== 'string') {
    errors.push('Reset token is required');
  }

  if (!data.newPassword || typeof data.newPassword !== 'string') {
    errors.push('New password is required');
  } else if (data.newPassword.length < 6) {
    errors.push('New password must be at least 6 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
