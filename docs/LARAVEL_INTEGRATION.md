# Laravel Backend Integration Guide

This document describes how the BountyRUSH Slot Engine integrates with the Laravel-based backend using **Laravel Herd** and **PHP**.

---

## 1. Prerequisites

- **Laravel Herd** installed and running on Windows.
- **PHP 8.2+** enabled in Herd.
- **Composer** installed.

---

## 2. Backend Architecture

The Laravel backend replaces the legacy Node.js script and follows a clean MVC structure:

- **`SlotController`**: Handles API requests (`/load`, `/play`, `/play-free-game`, `/buy-free-game`).
- **`SlotEngine` Service**: Contains the core game math, RNG, and rule evaluation (243 ways, cascading logic, payouts).
- **`SessionManager`**: Manages player balance and free spin state using Laravel sessions or a database.

---

## 3. API Contract

The frontend (`slotApi.ts`) expects a specific JSON contract. The Laravel backend must return data matching these shapes:

### `/load` (GET)

Returns the initial game state, player balance, and any active free spin session.

### `/play` (POST)

Returns the outcome of a standard base game spin, including symbols, win amounts, and cascade steps.

### `/play-free-game` (POST)

Returns the outcome of a free spin, using the session state maintained in the backend.

### `/buy-free-game` (POST)

Deducts the buy cost and initializes a free spin session.

---

## 4. Setup Instructions

### 1. Initialize Laravel

```bash
cd c:\Users\Trainee\Desktop\BountyRUSH\slot
composer create-project laravel/laravel backend
```

### 2. Configure Herd

1. Open **Laravel Herd**.
2. Add `c:\Users\Trainee\Desktop\BountyRUSH\slot\backend` to the **Paths**.
3. The API will be available at `http://backend.test/api`.

### 3. Frontend Link

Update `src/domain/constants/Config.ts`:

```typescript
export const CONFIG = {
  // ...
  API_BASE_URL: "http://backend.test/api",
};
```

---

## 5. Development Workflow

1. **Backend Changes**: Modify Controllers and Services inside the `backend/` folder.
2. **Frontend Changes**: Update `src/` and run `npm run dev`.
3. **Verification**: Use the browser or Postman to test the `backend.test/api/play` endpoints.
