***

Use Plural Resource Names

* Collections should always use plural nouns.

***

Ex:

❌ DON'T

GET /user/42

✅ DO

GET /users/42

\*\*Keep Naming predictable across API

***

Return the Right Status Code

* Status Code should describe what actually happened

***

Ex:

❌ DON'T

200 OK

{

“error”: “User not found”

}

✅ DO

404 Not Found

{

“message”: “User not found”

}

\*\*Let the responses communicate clearly

***

Use the Correct HTTP Method

* Each request method has a specific purpose.

***

Ex:

❌ DON'T

POST /users/delete

✅ DO

DELETE /users/42

\*\*Consistency makes APIs intuitive

***

Filter Instead of Creating

New Endpoints

* Query Parameters make APIs flexible

***

Ex:

❌ DON'T

GET /activeUsers

✅ DO

GET /users?status=active\&page=1\&limit=10

\*\*Use query parameters for filtering, sorting and pagination

***

Version the API

* Never break existing clients

***

Ex:

❌ DON'T

/Users

✅ DO

404 Not Found

/api/v1/users

\*\*Versioning makes future updates safe.
