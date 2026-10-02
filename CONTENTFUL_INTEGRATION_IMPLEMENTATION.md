# Hosanna Contentful CMS Integration Blueprint

## Scope
This document covers the current Contentful integration in the backend:

- `seoMetadata`
- `siteConfiguration`
- `Page` content and homepage sections
- ministry detail content
- navigation and footer configuration
- `GET /api/content/site-configuration`
- `GET /api/content/pages/home`
- `GET /api/content/ministries/:slug`
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
- `navigationItems`
- `offeringUrl`
- footer text, links, social links, and contact information

### Homepage sections

The `Page` content type references ordered homepage sections. The backend currently normalizes:

- `heroSection`
- `aboutSection` and `aboutCard`
- `ministriesSection` and `ministry`
- `youthSection` and `youthActivity`
- `contactSection` and `contactServiceTime`
- `offeringSection` and `offeringPoint`
- `serviceTimesSection` and `serviceScheduleItem`

### Navigation and footer

- `siteLink`
- `siteSocialLink`

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

## Webhook Invalidations

The backend webhook handler clears the CMS cache namespace.

## Remaining Work

- Events continue to use the existing backend events API rather than Contentful.
- Contact and newsletter form delivery remain application behavior rather than CMS content.
- Configure the Contentful webhook to call the backend cache-invalidation endpoint after publishing content.
