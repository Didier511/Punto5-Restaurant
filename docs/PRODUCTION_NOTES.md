# Punto 5 Production Notes

This React app is frontend-only today. It keeps customer-facing state in localStorage so the migrated UI works immediately, but localStorage is not a production database or an auth boundary.

## Keep Private

- MongoDB connection string
- JWT or session secrets
- Password hashes
- Payment provider keys
- Email/SMS provider secrets
- Cloud image upload secrets
- Admin role assignment logic

Only expose `VITE_*` values that are safe to publish in browser JavaScript.

## MongoDB Backend Preset

When the backend is added, create an API service with environment variables like:

```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

Suggested collections:

- `users`: name, email, passwordHash, role, createdAt
- `dishes`: name, type, origin, price, description, imageUrl, tags, active
- `orders`: customer, phone, items, totals, status, deliveryCode, createdAt
- `reservations`: name, phone, guests, date, time, status, note
- `reviews`: dishId, userId, rating, text, createdAt

The React app is already separated around `src/lib/storage.js` and `src/lib/config.js`, so API calls can replace the local persistence layer later.
