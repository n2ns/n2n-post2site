# n2n-post2site Resources Reference

Resources expose read-only context and details through MCP resource reads. They are not tools and do not create, update, preview, upload, publish, or delete anything.

## Static Resources

### `post2site://capabilities`

Reads the backend publishing contract, workflow flags, auth mode, endpoint summary, and host-declared schema.

Backend endpoint:

```http
GET /capabilities
```

### `post2site://site-context`

Reads host positioning, product/content context, supported locales, and URL patterns.

Backend endpoint:

```http
GET /site-context
```

### `post2site://editorial-policy`

Reads editorial policy, evidence rules, CTA rules, prohibited claims, and publish blockers.

Backend endpoint:

```http
GET /editorial-policy
```

### `post2site://inventory/stats`

Reads unfiltered host inventory statistics.

Backend endpoint:

```http
GET /inventory/stats
```

## Resource Templates

### `post2site://inventory/resources/{target_identifier}`

Reads one existing host inventory resource by target identifier.

Backend endpoint:

```http
GET /inventory/resources/{target_identifier}
```

When a target identifier contains `/`, clients should percent-encode it in the resource URI. The bridge decodes the template variable once and forwards it to the backend with URL encoding.

Example:

```text
post2site://inventory/resources/guides%2Fexample-post
```

### `post2site://drafts/{draft_id}`

Reads one private server draft by draft ID.

Backend endpoint:

```http
GET /drafts/{draft_id}
```

## Size Boundary

Single inventory resource and draft resource reads are limited to 200 KiB of JSON response text. Oversized detail reads fail with a clear MCP error instead of silently flooding the client context.
