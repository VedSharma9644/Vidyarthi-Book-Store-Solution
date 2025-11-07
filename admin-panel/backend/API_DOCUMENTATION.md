# API Documentation

## Base URL
`http://localhost:5000`

## Schools API

### Get All Schools
- **Endpoint:** `GET /api/schools`
- **Description:** Retrieve all schools from the database
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "school_id",
      "name": "School Name",
      "branchName": "Branch Name",
      "code": "SCH001",
      "board": "CBSE",
      "address": "Full Address",
      "city": "City",
      "state": "State",
      "phoneNumber": "1234567890",
      "email": "school@example.com",
      "schoolLogo": "https://...",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Get School by ID
- **Endpoint:** `GET /api/schools/:id`
- **Description:** Retrieve a specific school by ID
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "school_id",
    "name": "School Name",
    ...
  }
}
```

### Create School
- **Endpoint:** `POST /api/schools`
- **Description:** Create a new school
- **Request Body:**
```json
{
  "name": "School Name",
  "branchName": "Branch Name",
  "code": "SCH001",
  "board": "CBSE",
  "address": "Full Address",
  "city": "City",
  "state": "State",
  "phoneNumber": "1234567890",
  "email": "school@example.com",
  "schoolLogo": "https://..." // optional
}
```
- **Response:**
```json
{
  "success": true,
  "message": "School created successfully",
  "data": { ... }
}
```

### Update School
- **Endpoint:** `PUT /api/schools/:id`
- **Description:** Update an existing school
- **Request Body:** Same as Create School
- **Response:**
```json
{
  "success": true,
  "message": "School updated successfully",
  "data": { ... }
}
```

### Delete School
- **Endpoint:** `DELETE /api/schools/:id`
- **Description:** Soft delete a school (sets isActive to false)
- **Response:**
```json
{
  "success": true,
  "message": "School deleted successfully"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Validation error 1", "Validation error 2"] // optional
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `404` - Not Found
- `500` - Internal Server Error

