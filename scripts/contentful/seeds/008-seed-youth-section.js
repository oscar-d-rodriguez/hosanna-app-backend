const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('contentful-management');
require('dotenv').config();

const LOCALE = 'en-US';
const SPANISH_LOCALE = 'es';
const SITE_KEY = 'hosanna';
const HOME_PAGE_KEY = 'home';
const YOUTH_SECTION_CONTENT_TYPE = 'youthSection';
const YOUTH_ACTIVITY_CONTENT_TYPE = 'youthActivity';
const MINISTRIES_SECTION_CONTENT_TYPE = 'ministriesSection';
const FRONTEND_ROOT = path.resolve(__dirname, '../../../../v0-church-website-design');
const INSTAGRAM_URL = 'https://www.instagram.com/legacyleadersofficial/';

const activities = [
  {
    internalName: 'Youth Activity - Bible Study',
    icon: 'bookOpen',
    text: { [LOCALE]: 'Weekly Bible Study', [SPANISH_LOCALE]: 'Estudio Bíblico' },
  },
  {
    internalName: 'Youth Activity - Worship',
    icon: 'music2',
    text: { [LOCALE]: 'Youth Worship Nights', [SPANISH_LOCALE]: 'Noches de Alabanza' },
  },
  {
    internalName: 'Youth Activity - Retreats',
    icon: 'mountain',
    text: { [LOCALE]: 'Annual Retreats', [SPANISH_LOCALE]: 'Campamentos y Eventos' },
  },
];

const youthSectionContent = {
  internalName: 'Hosanna Youth Section',
  eyebrow: { [LOCALE]: 'Faith for the Next Generation', [SPANISH_LOCALE]: 'Fe para la Próxima Generación' },
  headline: { [LOCALE]: 'Youth Ministry', [SPANISH_LOCALE]: 'Legacy Leaders' },
  description: {
    [LOCALE]: "Our youth ministry is a dynamic space where young people can explore their faith, build meaningful friendships, and discover their purpose in God's plan.",
    [SPANISH_LOCALE]: 'Un espacio donde los jóvenes fortalecen su fe, crean amistades y descubren el propósito que Dios tiene para sus vidas.',
  },
  activitiesHeading: { [LOCALE]: 'Activities & Events', [SPANISH_LOCALE]: 'Actividades' },
  primaryCtaLabel: { [LOCALE]: 'Follow Us', [SPANISH_LOCALE]: 'Síguenos' },
  primaryCtaUrl: INSTAGRAM_URL,
  mainImage: {
    path: 'public/images/youth1.jpg',
    altText: { [LOCALE]: 'Youth Ministry', [SPANISH_LOCALE]: 'Ministerio de Jóvenes' },
  },
  secondaryImage: {
    path: 'public/images/youth2.jpg',
    altText: { [LOCALE]: 'Youth Worship', [SPANISH_LOCALE]: 'Alabanza Juvenil' },
  },
  tertiaryImage: {
    path: 'public/images/youth3.jpg',
    altText: { [LOCALE]: 'Youth Community', [SPANISH_LOCALE]: 'Comunidad Juvenil' },
  },
  mainImageOverlayText: { [LOCALE]: 'Legacy Leaders', [SPANISH_LOCALE]: 'Legacy Leaders' },
  floatingBadge: { [LOCALE]: 'NEW', [SPANISH_LOCALE]: 'NEW' },
};

function getRequiredEnvironment() {
  const requiredVariables = [
    'CONTENTFUL_SPACE_ID',
    'CONTENTFUL_ENVIRONMENT_ID',
    'CONTENTFUL_MANAGEMENT_TOKEN',
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }

  return {
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  };
}

function getEntryLink(id) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
}

function getAssetLink(id) {
  return { sys: { type: 'Link', linkType: 'Asset', id } };
}

function getLocalAssetPath(relativePath) {
  return path.join(FRONTEND_ROOT, relativePath);
}

function getAssetFileName(relativePath) {
  return path.basename(relativePath);
}

function getLocalizedFields(values) {
  return { [LOCALE]: values[LOCALE], [SPANISH_LOCALE]: values[SPANISH_LOCALE] };
}

async function getEntries(clientParams, query) {
  return clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query,
  });
}

async function findUniqueEntry(clientParams, contentType, internalName) {
  const response = await getEntries(clientParams, {
    content_type: contentType,
    'fields.internalName': internalName,
    locale: LOCALE,
    limit: 1000,
  });

  if (response.items.length > 1) {
    throw new Error(`Found ${response.items.length} ${contentType} entries named ${internalName}; refusing to choose one`);
  }

  return response.items[0] || null;
}

async function ensureAsset(clientParams, relativePath) {
  const fileName = getAssetFileName(relativePath);
  const assets = await clientParams.client.asset.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: { limit: 1000 },
  });
  const existing = assets.items.find((asset) => asset.fields?.file?.[LOCALE]?.fileName === fileName);

  if (existing) {
    console.log(`Asset ${fileName} already exists; reusing ${existing.sys.id}`);
    return existing;
  }

  const localPath = getLocalAssetPath(relativePath);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Required frontend asset does not exist: ${localPath}`);
  }

  const asset = await clientParams.client.asset.createFromFiles(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId },
    {
      fields: {
        title: { [LOCALE]: fileName },
        file: {
          [LOCALE]: {
            contentType: 'image/jpeg',
            fileName,
            file: fs.createReadStream(localPath),
          },
        },
      },
    }
  );
  const processedAsset = await clientParams.client.asset.processForAllLocales(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId },
    asset
  );
  const publishedAsset = await clientParams.client.asset.publish(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, assetId: processedAsset.sys.id },
    processedAsset
  );
  console.log(`Created and published asset ${fileName} as ${publishedAsset.sys.id}`);
  return publishedAsset;
}

async function ensureActivity(clientParams, activity) {
  const existing = await findUniqueEntry(clientParams, YOUTH_ACTIVITY_CONTENT_TYPE, activity.internalName);
  const fields = {
    internalName: { [LOCALE]: activity.internalName },
    icon: { [LOCALE]: activity.icon },
    text: getLocalizedFields(activity.text),
  };

  if (existing) {
    console.log(`Youth Activity ${activity.internalName} already exists; reusing ${existing.sys.id}`);
    return existing;
  }

  const entry = await clientParams.client.entry.create(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
      contentTypeId: YOUTH_ACTIVITY_CONTENT_TYPE,
    },
    { fields }
  );
  const publishedEntry = await clientParams.client.entry.publish(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: entry.sys.id },
    entry
  );
  console.log(`Created and published Youth Activity ${activity.internalName} as ${publishedEntry.sys.id}`);
  return publishedEntry;
}

function buildYouthSectionFields(activityEntries, mainImage, secondaryImage, tertiaryImage) {
  return {
    internalName: { [LOCALE]: youthSectionContent.internalName },
    eyebrow: getLocalizedFields(youthSectionContent.eyebrow),
    headline: getLocalizedFields(youthSectionContent.headline),
    description: getLocalizedFields(youthSectionContent.description),
    activitiesHeading: getLocalizedFields(youthSectionContent.activitiesHeading),
    activities: { [LOCALE]: activityEntries.map((entry) => getEntryLink(entry.sys.id)) },
    primaryCtaLabel: getLocalizedFields(youthSectionContent.primaryCtaLabel),
    primaryCtaUrl: { [LOCALE]: youthSectionContent.primaryCtaUrl },
    mainImage: { [LOCALE]: getAssetLink(mainImage.sys.id) },
    mainImageAltText: getLocalizedFields(youthSectionContent.mainImage.altText),
    mainImageOverlayText: getLocalizedFields(youthSectionContent.mainImageOverlayText),
    secondaryImage: { [LOCALE]: getAssetLink(secondaryImage.sys.id) },
    secondaryImageAltText: getLocalizedFields(youthSectionContent.secondaryImage.altText),
    tertiaryImage: { [LOCALE]: getAssetLink(tertiaryImage.sys.id) },
    tertiaryImageAltText: getLocalizedFields(youthSectionContent.tertiaryImage.altText),
    floatingBadge: getLocalizedFields(youthSectionContent.floatingBadge),
  };
}

async function ensureYouthSection(clientParams, activityEntries, mainImage, secondaryImage, tertiaryImage) {
  const existing = await findUniqueEntry(
    clientParams,
    YOUTH_SECTION_CONTENT_TYPE,
    youthSectionContent.internalName
  );
  const fields = buildYouthSectionFields(activityEntries, mainImage, secondaryImage, tertiaryImage);

  if (!existing) {
    const entry = await clientParams.client.entry.create(
      {
        spaceId: clientParams.spaceId,
        environmentId: clientParams.environmentId,
        contentTypeId: YOUTH_SECTION_CONTENT_TYPE,
      },
      { fields }
    );
    const publishedEntry = await clientParams.client.entry.publish(
      { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: entry.sys.id },
      entry
    );
    console.log(`Created and published Youth Section ${publishedEntry.sys.id}`);
    return publishedEntry;
  }

  existing.fields = { ...existing.fields, ...fields };
  const updatedEntry = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: existing.sys.id },
    existing
  );
  const publishedEntry = await clientParams.client.entry.publish(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: updatedEntry.sys.id },
    updatedEntry
  );
  console.log(`Updated and published Youth Section ${publishedEntry.sys.id}`);
  return publishedEntry;
}

async function findHomePage(clientParams, siteConfiguration) {
  const response = await getEntries(clientParams, {
    content_type: 'page',
    'fields.siteConfiguration.sys.id': siteConfiguration.sys.id,
    'fields.pageKey': HOME_PAGE_KEY,
    locale: LOCALE,
    limit: 1,
  });
  return response.items[0] || null;
}

async function findMinistriesSection(clientParams) {
  const response = await getEntries(clientParams, {
    content_type: MINISTRIES_SECTION_CONTENT_TYPE,
    limit: 1000,
  });

  if (response.items.length !== 1) {
    throw new Error(`Expected exactly one Ministries Section but found ${response.items.length}`);
  }

  return response.items[0];
}

async function addYouthToHomePage(clientParams, homePage, ministriesSection, youthSection) {
  const sections = Array.isArray(homePage.fields.sections?.[LOCALE])
    ? homePage.fields.sections[LOCALE]
    : [];
  const youthAlreadyPresent = sections.some((section) => section?.sys?.id === youthSection.sys.id);

  if (youthAlreadyPresent) {
    console.log(`Home Page ${homePage.sys.id} already includes Youth Section; skipping`);
    return;
  }

  const ministriesIndex = sections.findIndex((section) => section?.sys?.id === ministriesSection.sys.id);
  if (ministriesIndex === -1) {
    throw new Error('Ministries Section is not linked from the existing Home Page; refusing to insert Youth Section');
  }

  const updatedSections = [...sections];
  updatedSections.splice(ministriesIndex + 1, 0, getEntryLink(youthSection.sys.id));
  homePage.fields.sections = {
    ...(homePage.fields.sections || {}),
    [LOCALE]: updatedSections,
  };
  const updatedHomePage = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: homePage.sys.id },
    homePage
  );
  await clientParams.client.entry.publish(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: updatedHomePage.sys.id },
    updatedHomePage
  );
  console.log(`Added Youth Section after Ministries and published Home Page ${updatedHomePage.sys.id}`);
}

async function findSiteConfiguration(clientParams) {
  const response = await getEntries(clientParams, {
    content_type: 'siteConfiguration',
    'fields.siteKey': SITE_KEY,
    locale: LOCALE,
    limit: 1,
  });
  return response.items[0] || null;
}

async function main() {
  const { spaceId, environmentId, managementToken } = getRequiredEnvironment();
  const client = createClient({ accessToken: managementToken });
  const clientParams = { client, spaceId, environmentId };

  await client.environment.get({ spaceId, environmentId });
  const siteConfiguration = await findSiteConfiguration(clientParams);
  if (!siteConfiguration) {
    throw new Error(`Site Configuration with siteKey ${SITE_KEY} was not found`);
  }

  const activityEntries = [];
  for (const activity of activities) {
    activityEntries.push(await ensureActivity(clientParams, activity));
  }

  const mainImage = await ensureAsset(clientParams, youthSectionContent.mainImage.path);
  const secondaryImage = await ensureAsset(clientParams, youthSectionContent.secondaryImage.path);
  const tertiaryImage = await ensureAsset(clientParams, youthSectionContent.tertiaryImage.path);
  const youthSection = await ensureYouthSection(
    clientParams,
    activityEntries,
    mainImage,
    secondaryImage,
    tertiaryImage
  );

  const homePage = await findHomePage(clientParams, siteConfiguration);
  if (!homePage) {
    throw new Error('Hosanna Home Page was not found');
  }

  const ministriesSection = await findMinistriesSection(clientParams);
  await addYouthToHomePage(clientParams, homePage, ministriesSection, youthSection);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  activities,
  youthSectionContent,
  buildYouthSectionFields,
  getLocalAssetPath,
  main,
};
