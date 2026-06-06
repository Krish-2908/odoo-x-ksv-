/**
 * Server-side validators
 * Each validator returns an error string on failure, or null on success.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{10,20}$/;
const NAME_RE  = /^[a-zA-Z\s'-]+$/;

const validate = {
  firstName(val) {
    if (!val || !val.trim()) return "First name is required.";
    if (val.trim().length < 2)  return "First name must be at least 2 characters.";
    if (val.trim().length > 50) return "First name must be under 50 characters.";
    if (!NAME_RE.test(val.trim())) return "First name can only contain letters, spaces, hyphens or apostrophes.";
    return null;
  },

  lastName(val) {
    if (!val || !val.trim()) return "Last name is required.";
    if (val.trim().length < 2)  return "Last name must be at least 2 characters.";
    if (val.trim().length > 50) return "Last name must be under 50 characters.";
    if (!NAME_RE.test(val.trim())) return "Last name can only contain letters, spaces, hyphens or apostrophes.";
    return null;
  },

  email(val) {
    if (!val || !val.trim()) return "Email address is required.";
    if (!EMAIL_RE.test(val.trim())) return "Enter a valid email address (e.g. name@company.com).";
    return null;
  },

  phone(val) {
    if (!val || !val.trim()) return "Phone number is required.";
    if (!PHONE_RE.test(val.trim())) return "Enter a valid phone number (10–20 digits, may include +, spaces, or dashes).";
    return null;
  },

  password(val) {
    if (!val) return "Password is required.";
    if (val.length < 8)          return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(val))      return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(val))      return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(val))      return "Password must contain at least one number.";
    return null;
  },

  country(val) {
    if (!val || !val.trim()) return "Country is required.";
    if (val.trim().length < 2)  return "Country must be at least 2 characters.";
    if (val.trim().length > 60) return "Country must be under 60 characters.";
    return null;
  },

  role(val) {
    const allowed = ["Admin", "Procurement Officer", "Vendor", "Manager"];
    if (!val) return "Role is required.";
    if (!allowed.includes(val)) return `Role must be one of: ${allowed.join(", ")}.`;
    return null;
  },
};

/**
 * Run multiple validators and return a map of field → error string.
 * Only failed fields appear in the result.
 */
function runValidators(fields) {
  const errors = {};
  for (const [field, value] of Object.entries(fields)) {
    if (validate[field]) {
      const err = validate[field](value);
      if (err) errors[field] = err;
    }
  }
  return errors;
}

module.exports = { validate, runValidators };
