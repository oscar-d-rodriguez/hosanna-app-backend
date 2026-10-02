const { createClient: defaultCreateClient } = require('contentful');
const defaultEnvironment = require('../config/environment');
const defaultLogger = require('../config/logger');

const SITE_CONFIGURATION_CONTENT_TYPE = 'siteConfiguration';
const PAGE_CONTENT_TYPE = 'page';
const HOME_PAGE_KEY = 'home';
const SUPPORTED_LOCALES = new Set(['en-US', 'es']);
const HERO_SECTION_CONTENT_TYPE = 'heroSection';
const ABOUT_SECTION_CONTENT_TYPE = 'aboutSection';
const MINISTRIES_SECTION_CONTENT_TYPE = 'ministriesSection';
const YOUTH_SECTION_CONTENT_TYPE = 'youthSection';
const CONTACT_SECTION_CONTENT_TYPE = 'contactSection';
const OFFERING_SECTION_CONTENT_TYPE = 'offeringSection';
const SERVICE_TIMES_SECTION_CONTENT_TYPE = 'serviceTimesSection';
const MINISTRY_CONTENT_TYPE = 'ministry';
const SOCIAL_PLATFORMS = new Set(['facebook', 'instagram', 'youtube']);
const HERO_SLIDE_CONTENT_MODES = new Set(['shared', 'perSlide']);
const MINISTRY_ICON_KEYS = new Set(['music', 'baby', 'users', 'userCircle', 'globe', 'handHeart']);
const YOUTH_ACTIVITY_ICON_KEYS = new Set(['bookOpen', 'music2', 'mountain']);
const OFFERING_POINT_ICON_KEYS = new Set(['sparkles', 'heartHandshake', 'landmark']);
const GOOGLE_MAPS_EMBED_HOSTS = new Set(['www.google.com', 'maps.google.com']);

function mapAssetUrl(asset) {
  const maybeUrl = asset?.fields?.file?.url;
  if (!maybeUrl) {
    return null;
  }

  return maybeUrl.startsWith('//') ? `https:${maybeUrl}` : maybeUrl;
}

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeSafeCtaUrl = (value) => {
  const normalizedUrl = normalizeOptionalText(value);
  if (!normalizedUrl) {
    return null;
  }

  if (normalizedUrl.startsWith('#')) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith('/')) {
    return normalizedUrl.startsWith('//') ? null : normalizedUrl;
  }

  const lowerCaseUrl = normalizedUrl.toLowerCase();
  if (
    lowerCaseUrl.startsWith('https://') ||
    lowerCaseUrl.startsWith('http://') ||
    lowerCaseUrl.startsWith('mailto:') ||
    lowerCaseUrl.startsWith('tel:')
  ) {
    return normalizedUrl;
  }

  return null;
};

const normalizeSafeGoogleMapsEmbedUrl = (value) => {
  const normalizedUrl = normalizeOptionalText(value);
  if (!normalizedUrl) {
    return null;
  }

  try {
    const url = new URL(normalizedUrl);
    const isGoogleMapsEmbed =
      url.protocol === 'https:' &&
      GOOGLE_MAPS_EMBED_HOSTS.has(url.hostname) &&
      (url.hostname === 'maps.google.com' || url.pathname.startsWith('/maps/embed'));

    return isGoogleMapsEmbed ? normalizedUrl : null;
  } catch {
    return null;
  }
};

function createContentfulService({
  createClient = defaultCreateClient,
  environment = defaultEnvironment,
  logger = defaultLogger,
} = {}) {
  function normalizeCta(label, url) {
    const normalizedLabel = normalizeOptionalText(label);
    const normalizedUrl = normalizeSafeCtaUrl(url);

    if (!normalizedLabel || !normalizedUrl) {
      return {
        label: null,
        url: null,
      };
    }

    return {
      label: normalizedLabel,
      url: normalizedUrl,
    };
  }

  function normalizeHeroContentMode(value) {
    const normalizedMode = normalizeOptionalText(value);

    if (normalizedMode && HERO_SLIDE_CONTENT_MODES.has(normalizedMode)) {
      return normalizedMode;
    }

    logger.warn(
      { contentMode: value || null },
      'Unsupported hero contentMode; defaulting to shared'
    );
    return 'shared';
  }

  function normalizeHeroSlide(slideEntry, contentMode) {
    const slideFields = slideEntry?.fields || {};
    const slideAssetUrl = mapAssetUrl(slideFields.image);
    const imageAltText = normalizeOptionalText(slideFields.imageAltText);

    if (contentMode === 'shared') {
      return {
        image: slideAssetUrl,
        imageAltText,
      };
    }

    const slideCta = normalizeCta(slideFields.primaryCtaLabel, slideFields.primaryCtaUrl);
    return {
      image: slideAssetUrl,
      imageAltText,
      headline: normalizeOptionalText(slideFields.headline),
      subheadline: normalizeOptionalText(slideFields.subheadline),
      primaryCtaLabel: slideCta.label,
      primaryCtaUrl: slideCta.url,
    };
  }

  function normalizeHeroSection(entry) {
    const fields = entry?.fields || {};
    const contentMode = normalizeHeroContentMode(fields.contentMode);
    const heroCta = normalizeCta(fields.primaryCtaLabel, fields.primaryCtaUrl);
    const rawSlides = Array.isArray(fields.slides) ? fields.slides : [];

    return {
      type: 'hero',
      contentMode,
      headline: contentMode === 'shared' ? normalizeOptionalText(fields.headline) : null,
      subheadline: contentMode === 'shared' ? normalizeOptionalText(fields.subheadline) : null,
      primaryCtaLabel: contentMode === 'shared' ? heroCta.label : null,
      primaryCtaUrl: contentMode === 'shared' ? heroCta.url : null,
      slides: rawSlides.map((slide) => normalizeHeroSlide(slide, contentMode)),
    };
  }

  function normalizeAboutCard(cardEntry) {
    if (!cardEntry || typeof cardEntry !== 'object' || !cardEntry.fields) {
      return null;
    }

    const fields = cardEntry.fields;
    return {
      icon: normalizeOptionalText(fields.icon) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      description: normalizeOptionalText(fields.description) || '',
    };
  }

  function normalizeAboutSection(entry) {
    const fields = entry?.fields || {};
    const rawCards = Array.isArray(fields.cards) ? fields.cards : [];
    const imageOverlayBadge = normalizeOptionalText(fields.imageOverlayBadge);
    const imageOverlayHeadline = normalizeOptionalText(fields.imageOverlayHeadline);

    return {
      type: 'about',
      eyebrow: normalizeOptionalText(fields.eyebrow) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      description: normalizeOptionalText(fields.description) || '',
      images: {
        main: {
          image: normalizeAsset(fields.mainImage),
          altText: normalizeOptionalText(fields.mainImageAltText),
        },
        secondary: {
          image: normalizeAsset(fields.secondaryImage),
          altText: normalizeOptionalText(fields.secondaryImageAltText),
        },
        tertiary: {
          image: normalizeAsset(fields.tertiaryImage),
          altText: normalizeOptionalText(fields.tertiaryImageAltText),
        },
      },
      imageOverlay:
        imageOverlayBadge || imageOverlayHeadline
          ? {
              badge: imageOverlayBadge,
              headline: imageOverlayHeadline,
            }
          : null,
      cards: rawCards.map(normalizeAboutCard).filter(Boolean),
    };
  }

  function normalizeMinistryIcon(value) {
    const normalizedIcon = normalizeOptionalText(value);
    return normalizedIcon && MINISTRY_ICON_KEYS.has(normalizedIcon) ? normalizedIcon : 'users';
  }

  function normalizeMinistrySummary(entry) {
    if (!entry || typeof entry !== 'object' || !entry.fields) {
      return null;
    }

    const fields = entry.fields;
    return {
      slug: normalizeOptionalText(fields.slug) || '',
      icon: normalizeMinistryIcon(fields.icon),
      title: normalizeOptionalText(fields.title) || '',
      shortDescription: normalizeOptionalText(fields.shortDescription) || '',
    };
  }

  function normalizeMinistriesSection(entry) {
    const fields = entry?.fields || {};
    const rawMinistries = Array.isArray(fields.ministries) ? fields.ministries : [];

    return {
      type: 'ministries',
      eyebrow: normalizeOptionalText(fields.eyebrow) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      backgroundImage: normalizeAsset(fields.backgroundImage),
      ministries: rawMinistries.map(normalizeMinistrySummary).filter(Boolean),
    };
  }

  function normalizeYouthActivity(activityEntry) {
    if (!activityEntry || typeof activityEntry !== 'object' || !activityEntry.fields) {
      return null;
    }

    const fields = activityEntry.fields;
    const normalizedIcon = normalizeOptionalText(fields.icon);

    return {
      icon: normalizedIcon && YOUTH_ACTIVITY_ICON_KEYS.has(normalizedIcon) ? normalizedIcon : 'bookOpen',
      text: normalizeOptionalText(fields.text) || '',
    };
  }

  function normalizeYouthSection(entry) {
    const fields = entry?.fields || {};
    const rawActivities = Array.isArray(fields.activities) ? fields.activities : [];
    const primaryCta = normalizeCta(fields.primaryCtaLabel, fields.primaryCtaUrl);

    return {
      type: 'youth',
      eyebrow: normalizeOptionalText(fields.eyebrow) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      description: normalizeOptionalText(fields.description) || '',
      activitiesHeading: normalizeOptionalText(fields.activitiesHeading) || '',
      activities: rawActivities.map(normalizeYouthActivity).filter(Boolean),
      primaryCta: primaryCta.label && primaryCta.url ? primaryCta : null,
      images: {
        main: {
          image: normalizeAsset(fields.mainImage),
          altText: normalizeOptionalText(fields.mainImageAltText),
          overlayText: normalizeOptionalText(fields.mainImageOverlayText),
        },
        secondary: {
          image: normalizeAsset(fields.secondaryImage),
          altText: normalizeOptionalText(fields.secondaryImageAltText),
        },
        tertiary: {
          image: normalizeAsset(fields.tertiaryImage),
          altText: normalizeOptionalText(fields.tertiaryImageAltText),
        },
      },
      floatingBadge: normalizeOptionalText(fields.floatingBadge),
    };
  }

  function normalizeContactServiceTime(serviceTimeEntry) {
    if (!serviceTimeEntry || typeof serviceTimeEntry !== 'object' || !serviceTimeEntry.fields) {
      return null;
    }

    const fields = serviceTimeEntry.fields;
    return {
      day: normalizeOptionalText(fields.day) || '',
      timeDescription: normalizeOptionalText(fields.timeDescription) || '',
    };
  }

  function normalizeContactSection(entry) {
    const fields = entry?.fields || {};
    const rawServiceTimes = Array.isArray(fields.serviceTimes) ? fields.serviceTimes : [];
    const mapEmbedUrl = normalizeSafeGoogleMapsEmbedUrl(fields.mapEmbedUrl);

    return {
      type: 'contact',
      eyebrow: normalizeOptionalText(fields.eyebrow) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      contactInfo: {
        address: normalizeOptionalText(fields.address),
        phone: normalizeOptionalText(fields.phone),
        email: normalizeOptionalText(fields.email),
      },
      serviceTimes: rawServiceTimes.map(normalizeContactServiceTime).filter(Boolean),
      map: mapEmbedUrl
        ? {
            embedUrl: mapEmbedUrl,
            title: normalizeOptionalText(fields.mapTitle),
          }
        : null,
    };
  }

  function normalizeOfferingPoint(pointEntry) {
    if (!pointEntry || typeof pointEntry !== 'object' || !pointEntry.fields) {
      return null;
    }

    const fields = pointEntry.fields;
    const icon = normalizeOptionalText(fields.icon);
    return {
      icon: icon && OFFERING_POINT_ICON_KEYS.has(icon) ? icon : 'sparkles',
      title: normalizeOptionalText(fields.title) || '',
      description: normalizeOptionalText(fields.description) || '',
    };
  }

  function normalizeOfferingSection(entry) {
    const fields = entry?.fields || {};
    const rawGivingPoints = Array.isArray(fields.givingPoints) ? fields.givingPoints : [];
    const donateCta = normalizeCta(fields.donateCtaLabel, fields.donateCtaUrl);

    return {
      type: 'offering',
      eyebrow: normalizeOptionalText(fields.eyebrow) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      description: normalizeOptionalText(fields.description) || '',
      cardEyebrow: normalizeOptionalText(fields.cardEyebrow) || '',
      cardHeadline: normalizeOptionalText(fields.cardHeadline) || '',
      cardDescription: normalizeOptionalText(fields.cardDescription) || '',
      donateCta: donateCta.label && donateCta.url ? donateCta : null,
      accountLabel: normalizeOptionalText(fields.accountLabel) || '',
      accountValue: normalizeOptionalText(fields.accountValue) || '',
      accountDescription: normalizeOptionalText(fields.accountDescription) || '',
      givingPoints: rawGivingPoints.map(normalizeOfferingPoint).filter(Boolean),
      thankYouHeading: normalizeOptionalText(fields.thankYouHeading) || '',
      thankYouDescription: normalizeOptionalText(fields.thankYouDescription) || '',
    };
  }

  function normalizeServiceScheduleItem(itemEntry) {
    if (!itemEntry || typeof itemEntry !== 'object' || !itemEntry.fields) {
      return null;
    }

    const fields = itemEntry.fields;
    return {
      day: normalizeOptionalText(fields.day) || '',
      time: normalizeOptionalText(fields.time) || '',
      description: normalizeOptionalText(fields.description) || '',
    };
  }

  function normalizeServiceTimesSection(entry) {
    const fields = entry?.fields || {};
    const rawServices = Array.isArray(fields.services) ? fields.services : [];

    return {
      type: 'serviceTimes',
      eyebrow: normalizeOptionalText(fields.eyebrow) || '',
      headline: normalizeOptionalText(fields.headline) || '',
      address: normalizeOptionalText(fields.address) || '',
      backgroundImage: normalizeAsset(fields.backgroundImage),
      backgroundImageAltText: normalizeOptionalText(fields.backgroundImageAltText),
      services: rawServices.map(normalizeServiceScheduleItem).filter(Boolean),
    };
  }

  function normalizeMinistry(entry, siteConfiguration) {
    const fields = entry?.fields || {};
    const leaderName = normalizeOptionalText(fields.leaderName);
    const leaderImage = normalizeAsset(fields.leaderImage);
    const leaderImageAltText = normalizeOptionalText(fields.leaderImageAltText);
    const leaderRoleLabel = normalizeOptionalText(fields.leaderRoleLabel);
    const joinCtaHeading = normalizeOptionalText(fields.joinCtaHeading);
    const joinCtaDescription = normalizeOptionalText(fields.joinCtaDescription);
    const joinCtaLabel = normalizeOptionalText(fields.joinCtaLabel);
    const rawWhatWeDoItems = Array.isArray(fields.whatWeDoItems) ? fields.whatWeDoItems : [];

    return {
      slug: normalizeOptionalText(fields.slug) || '',
      icon: normalizeMinistryIcon(fields.icon),
      title: normalizeOptionalText(fields.title) || '',
      shortDescription: normalizeOptionalText(fields.shortDescription) || '',
      detailDescription: normalizeOptionalText(fields.detailDescription) || '',
      heroImage: normalizeAsset(fields.heroImage),
      heroImageAltText: normalizeOptionalText(fields.heroImageAltText),
      leader:
        leaderName || leaderImage || leaderImageAltText || leaderRoleLabel
          ? {
              name: leaderName,
              image: leaderImage,
              imageAltText: leaderImageAltText,
              roleLabel: leaderRoleLabel,
            }
          : null,
      whatWeDoItems: rawWhatWeDoItems.map(normalizeOptionalText).filter(Boolean),
      schedule: normalizeOptionalText(fields.schedule),
      contactEmail: normalizeOptionalText(fields.contactEmail),
      joinCta:
        joinCtaHeading || joinCtaDescription || joinCtaLabel
          ? {
              heading: joinCtaHeading,
              description: joinCtaDescription,
              label: joinCtaLabel,
            }
          : null,
      seoMetadata: fields.seoMetadata
        ? normalizeSeoMetadata(fields.seoMetadata)
        : siteConfiguration?.defaultSeoMetadata || normalizeSeoMetadata(null),
    };
  }

  function normalizePageSection(sectionEntry) {
    const sectionContentType = sectionEntry?.sys?.contentType?.sys?.id || null;

    if (sectionContentType === HERO_SECTION_CONTENT_TYPE) {
      return normalizeHeroSection(sectionEntry);
    }

    if (sectionContentType === ABOUT_SECTION_CONTENT_TYPE) {
      return normalizeAboutSection(sectionEntry);
    }

    if (sectionContentType === MINISTRIES_SECTION_CONTENT_TYPE) {
      return normalizeMinistriesSection(sectionEntry);
    }

    if (sectionContentType === YOUTH_SECTION_CONTENT_TYPE) {
      return normalizeYouthSection(sectionEntry);
    }

    if (sectionContentType === CONTACT_SECTION_CONTENT_TYPE) {
      return normalizeContactSection(sectionEntry);
    }

    if (sectionContentType === OFFERING_SECTION_CONTENT_TYPE) {
      return normalizeOfferingSection(sectionEntry);
    }

    if (sectionContentType === SERVICE_TIMES_SECTION_CONTENT_TYPE) {
      return normalizeServiceTimesSection(sectionEntry);
    }

    return null;
  }

  function hasConfig() {
    const cfg = environment.contentful;
    return Boolean(cfg.spaceId && cfg.environmentId && cfg.deliveryToken && cfg.siteKey);
  }

  function buildClient({ preview }) {
    const cfg = environment.contentful;
    const accessToken = preview ? cfg.previewToken : cfg.deliveryToken;

    if (!cfg.spaceId || !cfg.environmentId || !accessToken) {
      return null;
    }

    return createClient({
      space: cfg.spaceId,
      environment: cfg.environmentId,
      accessToken,
      host: preview ? 'preview.contentful.com' : 'cdn.contentful.com',
      timeout: cfg.requestTimeoutMs,
    });
  }

  function normalizeAsset(asset) {
    const fields = asset?.fields || {};
    const file = fields.file || {};
    const details = file.details || {};
    const imageDetails = details.image || {};
    const url = mapAssetUrl(asset);

    if (!url) {
      return null;
    }

    return {
      url,
      title: normalizeOptionalText(fields.title) || '',
      description: normalizeOptionalText(fields.description),
      width: imageDetails.width || null,
      height: imageDetails.height || null,
      contentType: file.contentType || '',
    };
  }

  function normalizeSeoMetadata(entry) {
    const fields = entry?.fields || {};
    const pageTitle = normalizeOptionalText(fields.pageTitle) || '';
    const description = normalizeOptionalText(fields.description) || '';

    return {
      pageTitle,
      description,
      socialTitle: normalizeOptionalText(fields.socialTitle) || pageTitle,
      socialDescription: normalizeOptionalText(fields.socialDescription) || description,
      socialImage: normalizeAsset(fields.socialImage),
      hideFromSearchEngines: Boolean(fields.hideFromSearchEngines),
    };
  }

  function normalizeSiteLink(entry) {
    const fields = entry?.fields || {};
    const label = normalizeOptionalText(fields.label);
    const href = normalizeSafeCtaUrl(fields.href);

    if (!label || !href) {
      return null;
    }

    return {
      label,
      href,
      isOffering: Boolean(fields.isOffering),
    };
  }

  function normalizeSiteSocialLink(entry) {
    const fields = entry?.fields || {};
    const platform = normalizeOptionalText(fields.platform);
    const href = normalizeSafeCtaUrl(fields.href);

    if (!platform || !SOCIAL_PLATFORMS.has(platform) || !href?.startsWith('https://')) {
      return null;
    }

    return { platform, href };
  }

  function normalizeSiteConfiguration(entry) {
    const fields = entry?.fields || {};
    const navigationItems = Array.isArray(fields.navigationItems) ? fields.navigationItems : [];
    const footerLinks = Array.isArray(fields.footerLinks) ? fields.footerLinks : [];
    const footerSocialLinks = Array.isArray(fields.footerSocialLinks) ? fields.footerSocialLinks : [];
    const siteConfiguration = {
      internalName: fields.internalName || '',
      siteKey: fields.siteKey || '',
      organizationName: fields.organizationName || '',
      organizationLogo: normalizeAsset(fields.organizationLogo),
      defaultSeoMetadata: normalizeSeoMetadata(fields.defaultSeoMetadata),
      navigationItems: navigationItems.map(normalizeSiteLink).filter(Boolean),
      offeringUrl: normalizeSafeCtaUrl(fields.offeringUrl),
      footer: {
        tagline: normalizeOptionalText(fields.footerTagline),
        quickLinksHeading: normalizeOptionalText(fields.footerQuickLinksHeading),
        connectHeading: normalizeOptionalText(fields.footerConnectHeading),
        copyright: normalizeOptionalText(fields.footerCopyright),
        quickLinks: footerLinks.map(normalizeSiteLink).filter(Boolean),
        socialLinks: footerSocialLinks.map(normalizeSiteSocialLink).filter(Boolean),
        contactInfo: {
          address: normalizeOptionalText(fields.footerAddress),
          phone: normalizeOptionalText(fields.footerPhone),
          email: normalizeOptionalText(fields.footerEmail),
        },
      },
    };

    const organizationDescription = normalizeOptionalText(fields.organizationDescription);
    if (organizationDescription) {
      siteConfiguration.organizationDescription = organizationDescription;
    }

    return siteConfiguration;
  }

  function normalizePage(entry, siteConfiguration) {
    const fields = entry?.fields || {};
    const pageKey = fields.pageKey || HOME_PAGE_KEY;
    const slug = normalizeOptionalText(fields.slug) || '';
    const title = fields.title || '';
    const sections = Array.isArray(fields.sections)
      ? fields.sections.map(normalizePageSection).filter(Boolean)
      : [];
    const resolvedSeoMetadata = fields.seoMetadata
      ? normalizeSeoMetadata(fields.seoMetadata)
      : siteConfiguration?.defaultSeoMetadata || normalizeSeoMetadata(null);

    return {
      pageKey,
      title,
      slug,
      seoMetadata: resolvedSeoMetadata,
      sections,
    };
  }

  async function getSiteConfiguration({ locale = 'en-US', preview = false } = {}) {
    if (!SUPPORTED_LOCALES.has(locale)) {
      return null;
    }

    if (!hasConfig()) {
      logger.warn('Contentful is not configured; site configuration is unavailable');
      return null;
    }

    const client = buildClient({ preview });
    if (!client) {
      return null;
    }

    const response = await client.getEntries({
      content_type: SITE_CONFIGURATION_CONTENT_TYPE,
      'fields.siteKey': environment.contentful.siteKey,
      locale,
      include: 2,
      limit: 1,
    });

    const entry = response?.items?.[0] || null;
    return entry ? normalizeSiteConfiguration(entry) : null;
  }

  async function getHomePage({ locale = 'en-US', preview = false } = {}) {
    if (!SUPPORTED_LOCALES.has(locale)) {
      return null;
    }

    if (!hasConfig()) {
      logger.warn('Contentful is not configured; home page is unavailable');
      return null;
    }

    const client = buildClient({ preview });
    if (!client) {
      return null;
    }

    const siteResponse = await client.getEntries({
      content_type: SITE_CONFIGURATION_CONTENT_TYPE,
      'fields.siteKey': environment.contentful.siteKey,
      locale,
      include: 2,
      limit: 1,
    });

    const siteEntry = siteResponse?.items?.[0] || null;
    if (!siteEntry) {
      return null;
    }

    const normalizedSiteConfiguration = normalizeSiteConfiguration(siteEntry);

    const pageResponse = await client.getEntries({
      content_type: PAGE_CONTENT_TYPE,
      'fields.siteConfiguration.sys.id': siteEntry.sys.id,
      'fields.pageKey': HOME_PAGE_KEY,
      locale,
      include: 3,
      limit: 1,
    });

    const pageEntry = pageResponse?.items?.[0] || null;
    if (!pageEntry) {
      return null;
    }

    return normalizePage(pageEntry, normalizedSiteConfiguration);
  }

  async function getMinistry({ slug, locale = 'en-US', preview = false } = {}) {
    if (!SUPPORTED_LOCALES.has(locale) || !normalizeOptionalText(slug)) {
      return null;
    }

    if (!hasConfig()) {
      logger.warn('Contentful is not configured; ministry is unavailable');
      return null;
    }

    const client = buildClient({ preview });
    if (!client) {
      return null;
    }

    const siteResponse = await client.getEntries({
      content_type: SITE_CONFIGURATION_CONTENT_TYPE,
      'fields.siteKey': environment.contentful.siteKey,
      locale,
      include: 2,
      limit: 1,
    });

    const siteEntry = siteResponse?.items?.[0] || null;
    if (!siteEntry?.sys?.id) {
      return null;
    }

    const normalizedSiteConfiguration = normalizeSiteConfiguration(siteEntry);
    const ministryResponse = await client.getEntries({
      content_type: MINISTRY_CONTENT_TYPE,
      'fields.slug': normalizeOptionalText(slug),
      'fields.siteConfiguration.sys.id': siteEntry.sys.id,
      locale,
      include: 3,
      limit: 1,
    });

    const ministryEntry = ministryResponse?.items?.[0] || null;
    return ministryEntry ? normalizeMinistry(ministryEntry, normalizedSiteConfiguration) : null;
  }

  return {
    getHomePage,
    getMinistry,
    getSiteConfiguration,
    mapAsset: mapAssetUrl,
    normalizeAsset,
    normalizeSeoMetadata,
    normalizePage,
    normalizeSiteConfiguration,
    normalizeMinistry,
    normalizeMinistriesSection,
    normalizeYouthSection,
    normalizeContactSection,
    normalizeOfferingSection,
    normalizeServiceTimesSection,
  };
}

const defaultService = createContentfulService();

module.exports = {
  createContentfulService,
  ...defaultService,
};
