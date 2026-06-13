# Farmer Market Nepal

## Project Overview

Farmer Market Nepal is a minimal full-stack marketplace web application built with Node.js, Express, SQLite (via sql.js), EJS, and Multer. It is designed to connect farmers and buyers through a simple online marketplace where farmers can register products, buyers can browse and place orders, and administrators can manage users and products.

## Purpose

The primary goal of this project is to demonstrate a practical end-to-end web application built using a minimal technology stack. It supports user authentication, role-based access control, product management, order processing, and a small server-rendered dashboard system.

## Key Features

- User authentication with registration and login
- Role-based access: Farmer, Buyer, Admin
- Product CRUD for farmers
- Public product listing and search/filter support
- Order creation for buyers
- Admin management of users and products
- File upload support for product images
- SQLite database persistence via `sql.js`
- Session-based authentication with `express-session`

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Mandeep21ss/FarmerMarketNepal.git
   cd FarmerMarketNepal
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open the browser at `http://localhost:3000`

## Project Structure

- `server.js` — Express server setup, middleware registration, and route mounting
- `database/db.js` — Database initialization, schema creation, and SQL helper wrappers
- `routes/` — API and page route handlers for auth, products, orders, users, and views
- `views/` — EJS templates for server-rendered pages and dashboards
- `public/` — Static assets including CSS and JavaScript
- `uploads/` — Uploaded product images generated at runtime

## Usage

### Register a user

- Farmers and buyers can register via the `/register` page.
- Admin users must be created directly in the database or via a future admin registration flow.

### Log in

- Log in from `/login`.
- After successful login, users are redirected to dashboards based on their role.

### Farmer workflow

- Farmers can access `/dashboard/farmer` to view and manage their products.
- Farmers can create new products using the product API.

### Buyer workflow

- Buyers can browse products from the home page and place orders.
- Buyer orders are managed through the orders API.

### Admin workflow

- Admins can access `/dashboard/admin` to view users and products.
- Admins can delete users and manage the platform.

## API Endpoints

### Authentication

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Log in existing user
- `POST /api/auth/logout` — Log out current session

### Products

- `GET /api/products` — List products with optional `q` and `category` query parameters
- `POST /api/products` — Create a new product (farmer only)
- `PUT /api/products/:id` — Update a product (farmer/admin)
- `DELETE /api/products/:id` — Delete a product (farmer/admin)
- `GET /api/products/mine/list` — List current farmer's products

### Orders

- `POST /api/orders` — Create a buyer order
- `GET /api/orders` — List orders for current user, admin, or farmer

### Users

- `GET /api/users/:id` — Get user details for self or admin
- `GET /api/users` — List users (admin only)
- `DELETE /api/users/:id` — Delete a user (admin only)

## Database

The project uses SQLite through the `sql.js` WebAssembly library. Database file persistence is handled by `database/database.sqlite`.

### Tables

- `users` — Stores registered users and roles
- `categories` — Stores product categories
- `products` — Stores product listings and farmer relationships
- `orders` — Stores buyer orders and totals
- `order_items` — Stores line items for each order

## Notes

- The project uses in-memory sessions (`express-session`) and is suitable for development and learning.
- Production deployment should use a persistent session store and secure session secrets.
- Uploaded files are stored in `uploads/` and referenced from `/uploads/<filename>`.

## Dependencies

- `express` — Web server and request handling
- `express-session` — Session management
- `ejs` — Server-side HTML templating
- `bcrypt` — Password hashing
- `multer` — File upload middleware
- `sql.js` — SQLite database engine in WebAssembly
- `uuid` — Unique ID generation (if used in future uploads or identifiers)

## Recommended Improvements

- Add admin registration and user role management workflows
- Replace in-memory sessions with Redis or another persistent store
- Add validation and sanitization for all user inputs
- Improve error responses with consistent JSON formatting
- Add automated tests for API and route flows
- Add frontend forms for product creation and ordering

## License

This project is provided as a learning exercise and does not include a license file. Add a license if you wish to publish it publicly.

