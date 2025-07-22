# Current Authentication System Documentation
*Last Updated: July 22, 2025*

## Overview
Our authentication system combines Supabase auth with Abstract Global Wallet (AGW) integration, providing both email/password and wallet-based authentication.

## Core Components

### 1. Wallet Integration (Primary)
- **Primary Wallet**: Abstract Global Wallet (AGW) only
- **Component**: `src/components/AGWConnect.tsx`
- **Provider**: Uses `AbstractWalletProvider` from `@abstract-foundation/agw-react`
- **Styling**: Retsba pink connected wallet button (`bg-retsba hover:bg-retsba/90 text-white`)

### 2. Authentication Modal
- **Component**: `src/components/AuthModal.tsx`
- **Features**:
  - Email/password signup and login
  - Wallet-based account creation
  - AGW validation for account creation
  - Error handling with toast notifications
  - Random display name generation for new users

### 3. Dedicated Auth Page
- **Route**: `/auth`
- **Component**: `src/pages/Auth.tsx`
- **Features**:
  - Full-page authentication interface
  - Email signup with AGW validation
  - Automatic redirect to main page when authenticated
  - Error handling and user feedback

### 4. AGW-Only Account Creation Validation
- **File**: `src/utils/agwValidation.ts`
- **Functions**:
  - `useIsAGWConnected()`: Hook to check AGW connection status
  - `validateAGWForAccountCreation()`: Validates AGW requirement for account creation
- **Error Message**: "You must be using an Abstract Global Wallet (AGW) to create an account. If you do not have an AGW, you can create one at www.abs.xyz"

## Database Schema

### Profiles Table
- **Table**: `public.profiles`
- **Columns**:
  - `id`: UUID primary key
  - `user_id`: UUID reference to auth.users
  - `username`: Text (nullable)
  - `display_name`: Text (nullable)
  - `avatar_url`: Text (nullable) - Random default avatar assigned
  - `bio`: Text (nullable)
  - `wallet_address`: Text (nullable)
  - `banner_url`: Text (nullable)
  - `created_at`: Timestamp with timezone
  - `updated_at`: Timestamp with timezone

### RLS Policies
- **SELECT**: Profiles viewable by everyone
- **INSERT**: Users can insert their own profile
- **UPDATE**: Users can update their own profile
- **DELETE**: Not allowed

### Database Functions
- `handle_new_user()`: Trigger function that creates profile when user signs up
- `update_updated_at_column()`: Updates timestamp on profile changes
- `get_email_by_username()`: Retrieves email by username

## Authentication Flow

### Email/Password Signup
1. User enters email/password in AuthModal or Auth page
2. AGW validation checks if user has AGW connected
3. If no AGW: Error message with link to www.abs.xyz
4. If AGW present: Supabase auth signup with `emailRedirectTo`
5. Trigger creates profile with random avatar
6. User redirected to main page

### Wallet-Based Signup
1. User connects AGW wallet via AGWConnect component
2. User clicks wallet signup in AuthModal
3. AGW validation (always passes since AGW is connected)
4. Supabase auth creates user account
5. Profile created with wallet address
6. User redirected to main page

### Login Flow
1. User enters credentials in AuthModal or Auth page
2. Supabase auth login
3. Session established
4. User redirected to main page

## Security Features
- **AGW-Only Account Creation**: Enforced via validation functions
- **Smart Contract Wallet Security**: AGW provides built-in security
- **Secure Transaction Flow**: User approval required for all transactions
- **Session Management**: Supabase handles session persistence and refresh
- **RLS Policies**: Row-level security on profiles table
- **Input Validation**: Email format and password requirements

## Configuration
- **Supabase Project ID**: ksbrlstprqtqhfhynkcq
- **Abstract Chain**: Used for AGW connection
- **Storage Buckets**: avatars (public), banners (public)
- **Default Avatars**: 6 random default avatars assigned on signup

## Navigation Integration
- **NavBar**: Contains AuthModal trigger and AGWConnect component
- **Responsive**: Mobile and desktop authentication flows
- **Toast Notifications**: User feedback for all auth actions

## File Structure
```
src/
├── components/
│   ├── AGWConnect.tsx          # AGW wallet connection component
│   ├── AuthModal.tsx           # Authentication modal
│   └── NavBar.tsx              # Navigation with auth integration
├── pages/
│   └── Auth.tsx                # Dedicated authentication page
├── utils/
│   └── agwValidation.ts        # AGW validation utilities
└── integrations/
    └── supabase/
        └── client.ts           # Supabase client configuration
```

## Recent Changes Made Today
1. Removed bridging functionality completely
2. Simplified to AGW-only wallet connection
3. Removed other wallet connector options (WalletConnect, etc.)
4. Added AGW-only validation for account creation
5. Updated styling to use retsba pink for connected wallet button
6. Removed success toast from AGW connection

## Re-enabling Instructions
To re-enable authentication when ready:
1. Remove "coming soon" overlay from AuthModal and Auth page
2. Re-enable click handlers on auth buttons
3. Test AGW validation flow
4. Verify profile creation works correctly
5. Test both email and wallet signup flows

## Future Considerations
- Additional wallet connector options can be re-added later
- Bridging functionality can be restored from BRIDGE_IMPLEMENTATION_BACKUP.md
- Role-based access control could be implemented using user_roles table pattern
- Social login providers (Google, etc.) could be added to Supabase auth