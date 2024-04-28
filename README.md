Express Server with SQLite Database
This project is an Express server with SQLite database integration for user authentication and assignment management.

Setup Instructions
Clone the repository:
bash

git clone https://github.com/yourusername/express-sqlite-server.git
Install dependencies:
bash

cd express-sqlite-server
npm install
Run the server:
bash

npm start
The server will start running at http://localhost:3000 by default. You can change the port by setting the PORT environment variable.
Endpoints
Sign Up
URL: /signup
Method: POST
Request Body:
json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password"
}
Response: 201 Created or 500 Internal Server Error
Login
URL: /login
Method: POST
Request Body:
json

{
  "email": "john@example.com",
  "password": "password"
}
Response: JWT token or 401 Unauthorized
Create Assignment
URL: /assignments
Method: POST
Request Body:
json

{
  "assignment_name": "Assignment 1",
  "description": "Description of Assignment 1",
  "deadline": "2024-05-01",
  "marks": 100
}
Response: 201 Created or 500 Internal Server Error
Get All Assignments
URL: /assignments
Method: GET
Response: List of assignments or 500 Internal Server Error
Update Assignment
URL: /assignments/:id
Method: PUT
Request Body: Same as create endpoint
Response: 200 OK or 500 Internal Server Error
Delete Assignment
URL: /assignments/:id
Method: DELETE
Response: 200 OK or 500 Internal Server Error
Technologies Used
Express.js
SQLite
Bcrypt (for password hashing)
JSON Web Tokens (JWT) for authentication
