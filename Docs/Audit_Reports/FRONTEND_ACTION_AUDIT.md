# FRONTEND ACTION AUDIT

This document maps every user action across the application, tracing the path from the UI button/link down to the backend endpoint and database.

## Status Definitions
- **Working**: The action is fully implemented and connects to a backend/database successfully.
- **Broken**: The action is implemented but fails due to a bug or server error.
- **Missing API**: The frontend calls an API endpoint that does not exist.
- **Missing Handler**: The UI element exists but has no `onClick` or `onSubmit` logic attached.
- **Missing Database Logic**: The API endpoint exists but doesn't interact with the database correctly.
- **Dead UI**: The UI element is present but completely disconnected or unreachable.

---

### 1. Homepage (`pages/index.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Hero` | "Book Your Seat →" Link | Navigate to `/book-tickets` | Navigates to `/book-tickets` | none | **Working** |
| `Hero` | "Watch past shows" Link | Navigate to `/shows` | Navigates to `/shows` | none | **Working** |
| `Next Show` | "Book on Our Website" Link | Navigate to `/book-tickets` | Navigates to `/book-tickets` | none | **Working** |
| `Next Show` | "Book on BookMyShow" Link | Open BMS URL | Opens BMS URL | none | **Working** |
| `Performers`| "Apply Now" Link | Navigate to `/book-tickets?type=comedian` | Navigates to `/book-tickets?type=comedian` | none | **Working** |
| `Footer CTA`| "Apply to Perform →" Link| Navigate to `/book-tickets?type=comedian` | Navigates to `/book-tickets?type=comedian` | none | **Working** |

### 2. Authentication (`pages/auth/login.tsx` & `pages/auth/signup.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SignUp` | "Create Account" Form Submit | Registers a new user | Submits form, redirects to login | `/api/auth/signup` | **Working** |
| `Login` | "Sign in" Form Submit | Authenticates user | Logs in via NextAuth credentials | `/api/auth/[...nextauth]` | **Working** |
| `Auth` | "Show/Hide Password" | Toggles password visibility | Toggles input type between password/text | none | **Working** |

### 3. Book Tickets (`pages/book-tickets.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Booking Form`| "Book Show Tickets" Tab | Switch to Show Booking form | Sets bookingType state | none | **Working** |
| `Booking Form`| "Join as Comedian" Tab | Switch to Comedian Registration | Sets bookingType state | none | **Working** |
| `Booking Form`| Ticket Quantity (+ / -) | Increment/Decrement tickets | Updates state (min 1, max 50) | none | **Working** |
| `Booking Form`| "Submit Registration" (Comedian) | Register as a comedian | Submits form, shows success | `/api/comedians/register` | **Working** |
| `Booking Form`| "Book Tickets" (Show) | Initialize Razorpay Payment | Calls create order API, opens Razorpay, then verifies | `/api/bookings/create`, `/api/payments/create-order`, `/api/payments/verify` | **Working** |

### 4. Dashboard (`pages/dashboard.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Tabs` | "MY BOOKINGS" Tab | Show user's bookings | Updates active tab state | none | **Working** |
| `Tabs` | "PAYMENT HISTORY" Tab | Show user's payments | Updates active tab state | none | **Working** |
| `Bookings List`| "DOWNLOAD TICKET" | Generate and download PDF | Calls `createAndSaveTicket` utility | none | **Working** |
| `Bookings List`| Cancel Booking | Cancel a pending/approved booking | `handleCancelBooking` function is defined but **not attached to any UI element** | `/api/bookings/[id]` | **Dead UI** |

### 5. Profile (`pages/profile.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Profile Info`| "Edit Profile" Button | Enable form editing | Sets isEditing state to true | none | **Working** |
| `Profile Info`| "Save Changes" Form Submit | Update user profile details | Submits PUT request with new details | `/api/users/profile` | **Working** |
| `Security` | "Update Password" Form Submit | Change user password | Submits POST request to change password | `/api/users/change-password` | **Working** |

### 6. Shows (`pages/shows.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Next Show` | "Book on BookMyShow" Link | Open external BMS URL | Opens BMS URL | none | **Working** |
| `Next Show` | "Book on Our Website" Link | Navigate to `/book-tickets` | Navigates to `/book-tickets` | none | **Working** |
| `Bottom CTA`| "Follow @thehumourshub" Link | Open Instagram profile | Navigates to Instagram | none | **Working** |

### 7. Perform With Us (`pages/perform-with-us.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Form` | "Send Application" Button | Submit application form | Calls `e.preventDefault()` but **no fetch/submit logic exists** | none (Missing API call) | **Missing Handler** |
| `Form` | "WhatsApp Us" Button | Open WhatsApp | Button exists but **has no onClick handler** | none | **Missing Handler** |

### 8. Gallery (`pages/gallery.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Filters` | Category Filter Buttons | Filter images by category | Updates activeFilter state | none | **Working** |
| `Footer` | "@thehumourshub" Link | Open Instagram profile | Navigates to Instagram | none | **Working** |

### 9. Admin Panel (`pages/admin/index.tsx` & `components/admin/SiteCMS.tsx`)
| Component | Action Name | Expected Behavior | Actual Behavior | Backend Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Sidebar` | Navigation Tabs | Switch admin views | Sets active tab | none | **Working** |
| `Sidebar` | "Logout" | Sign out admin | NextAuth signOut | none | **Working** |
| `Bookings` | "Approve" / "Decline" Booking | Update booking status | Submits status update | `/api/admin/bookings` | **Working** |
| `Users` | "Reset Password" (Open Modal)| Open reset password modal | Sets selectedUser and modal state | none | **Working** |
| `Users` | "Reset Password" (Submit) | Reset user's password | Submits new password | `/api/admin/reset-password` | **Working** |
| `Comedians` | "Approve" / "Decline" App | Update comedian app status | Submits status update | `/api/admin/comedians` | **Working** |
| `CMS` | "+ Add [Item]" Buttons | Open content creation modals | Opens modal state | none | **Working** |
| `CMS` | "Save [Content]" Forms | Upload image and save content | Uploads to `/api/admin/cms/upload`, then POST/PUT content | `/api/admin/cms/content` | **Working** |
| `CMS` | "Archive"/"Restore"/"Delete" | Update content status | DELETE/PATCH request | `/api/admin/cms/content/[id]` | **Working** |
