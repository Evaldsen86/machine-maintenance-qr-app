# Machine History QR

A web application for managing machine maintenance history and QR code-based machine identification.

## Features

- Machine management with detailed information
- QR code generation and scanning
- Maintenance history tracking
- Task assignment and management
- User authentication and authorization
- Responsive design for mobile and desktop

## Tech Stack

- React + TypeScript
- Vite
- Supabase (Backend)
- Tailwind CSS
- Shadcn UI Components

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/machine-history-qr.git
   cd machine-history-qr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is deployed on Vercel. To deploy your own instance:

1. Fork this repository
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Add your environment variables in Vercel's project settings
5. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
