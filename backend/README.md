# Machine History QR Backend

This is the backend server for the Machine History QR application. It provides a RESTful API for managing machines, tasks, and maintenance records.

## Features

- CRUD operations for machines
- Task management
- Maintenance history tracking
- Oil information management
- MongoDB database integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a .env file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/machine-history
   NODE_ENV=development
   ```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Machines

- GET /api/machines - Get all machines
- GET /api/machines/:id - Get a specific machine
- POST /api/machines - Create a new machine
- PATCH /api/machines/:id - Update a machine
- DELETE /api/machines/:id - Delete a machine

### Tasks

- POST /api/machines/:id/tasks - Add a task to a machine

### Maintenance

- POST /api/machines/:id/maintenance - Add a maintenance record

### Oil Information

- POST /api/machines/:id/oil - Update oil information

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:

```json
{
  "message": "Error message here"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 