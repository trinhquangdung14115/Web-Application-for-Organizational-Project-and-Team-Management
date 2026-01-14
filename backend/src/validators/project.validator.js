/**
 * Project Validators
 * Validate request data for project operations
 */

/**
 * Validate create project data
 */
export const validateCreateProject = (data) => {
  const errors = [];

  // Name validation (REQUIRED)
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Project name is required');
  } else if (data.name.trim().length < 3) {
    errors.push('Project name must be at least 3 characters');
  } else if (data.name.trim().length > 100) {
    errors.push('Project name cannot exceed 100 characters');
  }

  // Description validation (OPTIONAL)
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  } else if (data.description && data.description.length > 500) {
    errors.push('Description cannot exceed 500 characters');
  }

  // Deadline validation (REQUIRED)
  if (!data.deadline) {
    errors.push('Deadline is required');
  } else if (isNaN(Date.parse(data.deadline))) {
    errors.push('Invalid deadline format');
  }

  // Manager validation (OPTIONAL)
  if (data.manager !== undefined && data.manager !== null && data.manager !== '') {
    if (typeof data.manager !== 'string') {
      errors.push('Manager must be a valid user ID');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate update project data
 */
export const validateUpdateProject = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Project name cannot be empty');
    } else if (data.name.trim().length < 3 || data.name.trim().length > 200) {
      errors.push('Project name must be between 3 and 200 characters');
    }
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (data.startDate !== undefined) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format');
    }
  }

  if (data.endDate !== undefined) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
    }
  }

  if (data.deadline !== undefined && data.deadline !== null) {
    const deadline = new Date(data.deadline);
    if (isNaN(deadline.getTime())) {
      errors.push('Invalid deadline format');
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate add member data
 */
export const validateAddMember = (data) => {
  const errors = [];

  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('User ID is required');
  }

  if (data.role !== undefined) {
    const validRoles = ['Admin', 'Manager', 'Member'];
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate update member role data
 */
export const validateUpdateMemberRole = (data) => {
  const errors = [];

  if (!data.role || typeof data.role !== 'string') {
    errors.push('Role is required');
  } else {
    const validRoles = ['Admin', 'Manager', 'Member'];
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate project query filters
 */
export const validateProjectQuery = (query) => {
  const errors = [];

  if (query.status) {
    const validStatuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
    if (!validStatuses.includes(query.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (query.archived !== undefined) {
    if (query.archived !== 'true' && query.archived !== 'false') {
      errors.push('Archived must be true or false');
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }

  if (query.page !== undefined) {
    const page = parseInt(query.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate join project by code
 */
export const validateJoinByCode = (data) => {
  const errors = [];

  if (!data.inviteCode || typeof data.inviteCode !== 'string') {
    errors.push('Invite code is required');
  } else if (data.inviteCode.trim().length === 0) {
    errors.push('Invite code cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
