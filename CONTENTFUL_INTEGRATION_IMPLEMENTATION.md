# Hosanna Contentful CMS Integration Blueprint

## Scope
This document covers only the current first Contentful slice in the backend:

- `seoMetadata`
- `siteConfiguration`
- `GET /api/content/site-configuration`
- Delivery API and Preview API behavior
- locale support for `en-US` and `es`
- caching
- webhook invalidation
- environment variables
- normalized API response

Events remain unchanged. Firebase remains unchanged.

## Implemented Content Types

### `seoMetadata`
Fields:
- `internalName`
- `pageTitle`
- `description`
- `socialTitle`
- `socialDescription`
- `socialImage`
- `hideFromSearchEngines`

### `siteConfiguration`
Fields:
- `internalName`
- `siteKey`
- `organizationName`
- `organizationLogo`
- `organizationDescription`
- `defaultSeoMetadata`

## API Contract

`GET /api/content/site-configuration?locale=es`

Supported locales:
- `en-US`
- `es`

Unsupported locales return HTTP 400.

Preview behavior:
- `preview=1` is supported
- preview requests require `x-cms-preview-key`
- if `CMS_PREVIEW_KEY` or `CONTENTFUL_PREVIEW_TOKEN` is missing, preview requests return HTTP 503 with a clear error

Contentful source behavior:
- Delivery API is used for published reads
- Preview API is used for preview reads

## Normalized Response

The backend returns its own DTO and does not expose raw Contentful `sys` objects or SDK entries.

Response shape:

```json
{
  "source": "contentful" | "unavailable",
  "locale": "en-US" | "es",
  "preview": true | false,
  "siteConfiguration": {
    "internalName": "",
    "siteKey": "",
    "organizationName": "",
    "organizationLogo": {
      "url": "",
      "title": "",
      "description": "",
      "width": 0,
      "height": 0,
      "contentType": ""
    },
    "organizationDescription": "",
    "defaultSeoMetadata": {
      "pageTitle": "",
      "description": "",
      "socialTitle": "",
      "socialDescription": "",
      "socialImage": null,
      "hideFromSearchEngines": false
    }
  }
}
```

Backend fallbacks:
- `socialTitle` falls back to `pageTitle`
- `socialDescription` falls back to `description`
- `socialImage` remains `null` when unavailable

If Contentful is unavailable:
- `source` is `unavailable`
- `siteConfiguration` is `null`
- no hardcoded church-specific content is returned
- no website-relative image paths are injected as fallback content

## Caching

- cache keys are prefixed with `cms:site-configuration:`
- webhook invalidation clears every key beginning with `cms:`

## Environment Variables

Required backend values for this slice:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT_ID`
- `CONTENTFUL_SITE_KEY`
- `CONTENTFUL_DELIVERY_TOKEN`
- `CONTENTFUL_PREVIEW_TOKEN`
- `CONTENTFUL_WEBHOOK_SECRET`
- `CMS_PREVIEW_KEY`
- `CONTENTFUL_REQUEST_TIMEOUT_MS`
- `CMS_CACHE_TTL_SECONDS`
- `WEBSITE_REVALIDATE_URL` optional

## Webhook Invalidations

The backend webhook handler clears the CMS cache namespace and can optionally notify a website revalidation endpoint when configured.

## Future Work

These are future tasks only and are not implemented in this slice:

- `Page`
- `Home`
- `navigation`
- reusable section content types

Do not claim website or Flutter changes are implemented unless those repositories actually contain those changes.
