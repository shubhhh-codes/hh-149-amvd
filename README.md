<!--
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
-->

# Humors Hub - Stand-up Comedy Show Booking Platform 🎭

A modern web application for booking stand-up comedy show tickets and managing comedian registrations.

## Features ✨

- **User Authentication** 🔐
  - Secure login and registration
  - Password reset functionality
  - Role-based access control

- **Ticket Booking** 🎟️
  - Easy ticket reservation process
  - Multiple ticket booking
  - Secure payment integration
  - Ticket price: ₹69 per ticket

- **Comedian Registration** 🎤
  - Comedian profile creation
  - Portfolio management
  - Performance scheduling

- **Admin Dashboard** 📊
  - User management
  - Booking oversight
  - Payment tracking
  - Performance analytics

- **PDF Generation** 📄
  - Downloadable tickets
  - Payment receipts
  - Booking confirmations

## Tech Stack 🛠️

- **Frontend**
  - Next.js 13+
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - React Icons

- **Backend**
  - Node.js
  - MongoDB
  - NextAuth.js
  - Razorpay Integration

- **Tools & Libraries**
  - React-PDF
  - React-Toastify
  - Hero Icons
  - DiceBear Avatars

## Getting Started 🚀

1. **Clone the repository**   ```bash
   git clone https://github.com/yourusername/humors-hub.git
   cd humors-hub   ```

2. **Install dependencies**   ```bash
   npm install   ```

3. **Set up environment variables**
   Create a `.env.local` file:   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   MONGODB_URI=your-mongodb-uri
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_SECRET=your-razorpay-secret   ```

4. **Run the development server**   ```bash
   npm run dev   ```

5. **Build for production**   ```bash
   npm run build
   npm start   ```

## API Routes 🛣️

- `/api/auth/*` - Authentication endpoints
- `/api/bookings/*` - Ticket booking management
- `/api/payments/*` - Payment processing
- `/api/users/*` - User management
- `/api/comedians/*` - Comedian profile management

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author ✍️

- **Kunal Gaud** - [@KunalG932](https://github.com/KunalG932)

## Acknowledgments 🙏

- Thanks to all contributors
- Inspired by the stand-up comedy community
- Built with ❤️ using Next.js and TypeScript
