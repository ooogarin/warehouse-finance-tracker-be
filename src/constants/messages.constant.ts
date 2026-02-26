// User-facing messages in English
// All messages that will be shown to end users should be here
export const SUCCESS_MESSAGES = {
  // General
  SUCCESS: 'Success',
  CREATED: 'Data created successfully',
  UPDATED: 'Data updated successfully',
  DELETED: 'Data deleted successfully',

  // Auth
  REGISTER_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset link has been sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',

  // Merchant
  MERCHANT_CREATED: 'Business created successfully',
  MERCHANT_UPDATED: 'Business updated successfully',
  MERCHANT_DELETED: 'Business deleted successfully',
  MEMBER_INVITED: 'Member invited successfully',
  MEMBER_REMOVED: 'Member removed successfully',

  // Supplier
  SUPPLIER_CREATED: 'Supplier added successfully',
  SUPPLIER_UPDATED: 'Supplier updated successfully',
  SUPPLIER_DELETED: 'Supplier deleted successfully',

  // Ingredient
  INGREDIENT_CREATED: 'Ingredient added successfully',
  INGREDIENT_UPDATED: 'Ingredient updated successfully',
  INGREDIENT_DELETED: 'Ingredient deleted successfully',
  CATEGORY_CREATED: 'Category added successfully',

  // Purchase Order
  PO_CREATED: 'Purchase order created successfully',
  PO_UPDATED: 'Purchase order updated successfully',
  PO_SUBMITTED: 'Purchase order submitted successfully',
  PO_APPROVED: 'Purchase order approved',
  PO_REJECTED: 'Purchase order rejected',
  PO_RECEIVED: 'Items received successfully',
  PO_CANCELLED: 'Purchase order cancelled',

  // Stock
  STOCK_ADDED: 'Stock added successfully',
  STOCK_CONSUMED: 'Stock consumed successfully',
  STOCK_ADJUSTED: 'Stock adjusted successfully',
  WASTE_RECORDED: 'Waste recorded successfully',

  // Cash
  INCOME_RECORDED: 'Income recorded successfully',
  EXPENSE_RECORDED: 'Expense recorded successfully',

  // Debt
  DEBT_CREATED: 'Debt recorded successfully',
  PAYMENT_RECORDED: 'Payment recorded successfully',
} as const;

// Error messages in English
export const ERROR_MESSAGES = {
  // General
  UNKNOWN_ERROR: 'An error occurred. Please try again',
  INVALID_REQUEST: 'Invalid request',
  INVALID_FORMAT: 'Invalid data format',

  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  UNAUTHORIZED: 'Please login first',
  FORBIDDEN: 'You do not have access',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',

  // User
  USER_NOT_FOUND: 'User not found',

  // Merchant
  MERCHANT_NOT_FOUND: 'Business not found',
  MERCHANT_NAME_REQUIRED: 'Business name is required',
  NOT_MERCHANT_MEMBER: 'You are not a member of this business',
  MEMBER_ALREADY_EXISTS: 'User is already a member',
  CANNOT_REMOVE_OWNER: 'Cannot remove the business owner',

  // Supplier
  SUPPLIER_NOT_FOUND: 'Supplier not found',
  SUPPLIER_NAME_REQUIRED: 'Supplier name is required',

  // Ingredient
  INGREDIENT_NOT_FOUND: 'Ingredient not found',
  INGREDIENT_NAME_REQUIRED: 'Ingredient name is required',
  CATEGORY_NOT_FOUND: 'Category not found',
  UNIT_NOT_FOUND: 'Unit not found',
  DUPLICATE_UNIT: 'Unit already exists',

  // Purchase Order
  PO_NOT_FOUND: 'Purchase order not found',
  INVALID_PO_STATUS: 'Invalid purchase order status',
  CANNOT_MODIFY_PO: 'Cannot modify purchase order',
  NO_ITEMS: 'At least one item is required',
  INVALID_QUANTITY: 'Invalid quantity',
  INVALID_PRICE: 'Invalid price',

  // Stock
  INSUFFICIENT_STOCK: 'Insufficient stock',
  BATCH_NOT_FOUND: 'Batch not found',
  NEGATIVE_STOCK: 'Stock cannot be negative',

  // Cash
  INVALID_AMOUNT: 'Invalid amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',

  // Debt
  DEBT_NOT_FOUND: 'Debt not found',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  OVERPAYMENT: 'Payment amount exceeds debt',

  // Validation
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number format',
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must be at most ${max} characters`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must be at most ${max}`,
} as const;

// Field labels in English
// Used for validation error messages
export const FIELD_LABELS = {
  email: 'Email',
  password: 'Password',
  name: 'Name',
  phone: 'Phone number',
  address: 'Address',
  description: 'Description',
  price: 'Price',
  quantity: 'Quantity',
  unit: 'Unit',
  category: 'Category',
  supplier: 'Supplier',
  merchant: 'Business',
  amount: 'Amount',
  date: 'Date',
  notes: 'Notes',
} as const;
