# Data Schema and API I/O

This document describes the request/response shapes used by the frontend when communicating with the backend via the Express proxy (`/api`). The frontend relies solely on MongoDB-backed endpoints (no local/offline storage).

Base URL: `/api`

## MongoDB Document: Fortune
Collection: `fortunes`

```json
{
  "_id": "ObjectId",
  "name": "string",           // 1..100 chars
  "birthdate": "string",      // DD/MM/YYYY
  "sex": "string",            // one of: male, female, other
  "topic": "string",          // one of: overall, career, finance, love, health
  "text": "string",           // 1..2000 chars (user message)
  "prediction": "string",     // model output
  "created_at": "string",     // ISO 8601
  "updated_at": "string"      // ISO 8601
}
```

## Health Check
- Method: GET
- Path: `/health`
- Request: No body
- Response 200 Application/JSON
```json
{
  "status": "OK"
}
```

## Create Fortune (Ask for prediction)
- Method: POST
- Path: `/fortune`
- Request Headers: `Content-Type: application/json`
- Request Body
Fields and constraints:
- `name` (string, required, 1..100)
- `birthdate` (string, required, format `DD/MM/YYYY`, valid calendar date)
- `sex` (enum, required: `male`, `female`, `other`)
- `topic` (enum, required: `overall`, `career`, `finance`, `love`, `health`)
- `text` (string, required, 1..2000)

Request Body example
```json
{
  "name": "Somchai",
  "birthdate": "12/08/1993",
  "sex": "male",
  "topic": "career",
  "text": "งานใหม่ปีนี้จะเป็นอย่างไร"
}
```
- Response 200 Application/JSON
```json
{
  "id": "string",              
  "prediction": "string"       
}
```
- Possible Errors
  - 400: validation error (missing/invalid fields)
    - Example body:
```json
{
  "error": "ValidationError",
  "details": [
    { "field": "birthdate", "message": "Invalid date format DD/MM/YYYY" }
  ]
}
```
  - 500: server/database error

## List Fortunes (History)
- Method: GET
- Path: `/fortune`
- Request: No body
- Response 200 Application/JSON
```json
{
  "fortunes": [
    {
      "id": "string",
      "name": "string",
      "birthdate": "string",
      "sex": "string",
      "topic": "string",
      "text": "string",
      "prediction": "string",
      "created_at": "string"
    }
  ]
}
```

## Update Fortune (Regenerate prediction for edited user text)
- Method: PUT
- Path: `/fortune/:id`
- Path Params
  - `id`: the fortune id to update
- Request Headers: `Content-Type: application/json`
- Request Body
Constraints: same as Create Fortune.

Request Body example
```json
{
  "name": "Somchai",
  "birthdate": "12/08/1993",
  "sex": "male",
  "topic": "career",
  "text": "ขอปรับข้อความ เพื่อถามอีกครั้ง"
}
```
- Response 200 Application/JSON
```json
{
  "prediction": "string"         
}
```
- Possible Errors
  - 404: fortune not found
  - 400/422: validation error
  - 500: server/database error

## Delete Fortune
- Method: DELETE
- Path: `/fortune/:id`
- Path Params
  - `id`: the fortune id to delete
- Request: No body
- Response
  - 200/204 on success
  - 404 if not found

## Field Notes
- `topic` accepted values: `overall`, `career`, `finance`, `love`, `health`.
- `sex` accepted values: `male`, `female`, `other`.
- `birthdate` is a string; backend may parse/validate.

## Frontend Mapping
- UI displays localized topic names but sends raw `topic` values above.
- Frontend expects `id` and `prediction` from POST `/fortune` to manage subsequent edits.

## Examples

### Example: Create Fortune Request
```json
{
  "name": "Somchai",
  "birthdate": "12/08/1993",
  "sex": "male",
  "topic": "career",
  "text": "งานใหม่ปีนี้จะเป็นอย่างไร"
}
```

### Example: Create Fortune Response
```json
{
  "id": "66e7c1c7f2a4f0c9b3a8a123",
  "prediction": "ปีนี้มีโอกาสเปลี่ยนงานไปในทิศทางที่ดี..."
}
```
