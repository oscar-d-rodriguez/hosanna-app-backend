const { createClient } = require('contentful-management');
require('dotenv').config();

const LOCALE = 'en-US';
const SPANISH_LOCALE = 'es';
const SITE_KEY = 'hosanna';
const HOME_PAGE_KEY = 'home';
const CONTACT_SECTION_CONTENT_TYPE = 'contactSection';
const CONTACT_SERVICE_TIME_CONTENT_TYPE = 'contactServiceTime';
const CONTACT_SECTION_INTERNAL_NAME = 'Hosanna Contact Section';
const CONTACT_PHONE = '(425) 644-6356';
const CONTACT_EMAIL = 'iglesia.hosanna@gmail.com';
const CONTACT_ADDRESS = '15220 Main St, Bellevue, WA 98007';
const MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.4876!2d-122.1467!3d47.6186!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54906c8d2a3b5555%3A0x123456789!2s15220%20Main%20St%2C%20Bellevue%2C%20WA%2098007!5e0!3m2!1sen!2sus!4v1234567890';

const serviceTimes = [
  {
    internalName: 'Contact Service Time - Friday',
    day: { [LOCALE]: 'Friday', [SPANISH_LOCALE]: 'Viernes' },
    timeDescription: {
      [LOCALE]: '7:00 PM - Bible Study',
      [SPANISH_LOCALE]: '7:00 PM - Estudio Bíblico',
    },
  },
  {
    internalName: 'Contact Service Time - Sunday',
    day: { [LOCALE]: 'Sunday', [SPANISH_LOCALE]: 'Domingo' },
    timeDescription: {
      [LOCALE]: '2:00 PM - Service',
      [SPANISH_LOCALE]: '2:00 PM - Servicio de Gloria',
    },
  },
  {
    internalName: 'Contact Service Time - Tuesday',
    day: { [LOCALE]: 'Tuesday', [SPANISH_LOCALE]: 'Martes' },
    timeDescription: {
      [LOCALE]: '7:00 PM - Prayer',
      [SPANISH_LOCALE]: '7:00 PM - Oración',
    },
  },
];

const contactSectionContent = {
  internalName: CONTACT_SECTION_INTERNAL_NAME,
  eyebrow: { [LOCALE]: "We'd Love to Hear From You", [SPANISH_LOCALE]: 'Queremos Conocerte' },
  headline: { [LOCALE]: 'Contact Us', [SPANISH_LOCALE]: 'Contáctanos' },
  address: CONTACT_ADDRESS,
  phone: CONTACT_PHONE,
  email: CONTACT_EMAIL,
  mapEmbedUrl: MAP_EMBED_URL,
  mapTitle: { [LOCALE]: 'Hosanna Church Location', [SPANISH_LOCALE]: 'Ubicación de Iglesia Hosanna' },
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

function getLocalizedFields(values) {
  return { [LOCALE]: values[LOCALE], [SPANISH_LOCALE]: values[SPANISH_LOCALE] };
}

function getEntryLink(id) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
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

async function publishEntry(clientParams, entry) {
  return clientParams.client.entry.publish(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: entry.sys.id },
    entry
  );
}

async function ensureServiceTime(clientParams, serviceTime) {
  const existing = await findUniqueEntry(
    clientParams,
    CONTACT_SERVICE_TIME_CONTENT_TYPE,
    serviceTime.internalName
  );
  const fields = {
    internalName: { [LOCALE]: serviceTime.internalName },
    day: getLocalizedFields(serviceTime.day),
    timeDescription: getLocalizedFields(serviceTime.timeDescription),
  };

  if (!existing) {
    const entry = await clientParams.client.entry.create(
      {
        spaceId: clientParams.spaceId,
        environmentId: clientParams.environmentId,
        contentTypeId: CONTACT_SERVICE_TIME_CONTENT_TYPE,
      },
      { fields }
    );
    const publishedEntry = await publishEntry(clientParams, entry);
    console.log(`Created and published Contact Service Time ${serviceTime.internalName} as ${publishedEntry.sys.id}`);
    return publishedEntry;
  }

  existing.fields = { ...existing.fields, ...fields };
  const updatedEntry = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: existing.sys.id },
    existing
  );
  const publishedEntry = await publishEntry(clientParams, updatedEntry);
  console.log(`Updated and published Contact Service Time ${serviceTime.internalName} as ${publishedEntry.sys.id}`);
  return publishedEntry;
}

function buildContactSectionFields(serviceTimeEntries) {
  return {
    internalName: { [LOCALE]: contactSectionContent.internalName },
    eyebrow: getLocalizedFields(contactSectionContent.eyebrow),
    headline: getLocalizedFields(contactSectionContent.headline),
    address: { [LOCALE]: contactSectionContent.address },
    phone: { [LOCALE]: contactSectionContent.phone },
    email: { [LOCALE]: contactSectionContent.email },
    serviceTimes: { [LOCALE]: serviceTimeEntries.map((entry) => getEntryLink(entry.sys.id)) },
    mapEmbedUrl: { [LOCALE]: contactSectionContent.mapEmbedUrl },
    mapTitle: getLocalizedFields(contactSectionContent.mapTitle),
  };
}

async function ensureContactSection(clientParams, serviceTimeEntries) {
  const existing = await findUniqueEntry(
    clientParams,
    CONTACT_SECTION_CONTENT_TYPE,
    CONTACT_SECTION_INTERNAL_NAME
  );
  const fields = buildContactSectionFields(serviceTimeEntries);

  if (!existing) {
    const entry = await clientParams.client.entry.create(
      {
        spaceId: clientParams.spaceId,
        environmentId: clientParams.environmentId,
        contentTypeId: CONTACT_SECTION_CONTENT_TYPE,
      },
      { fields }
    );
    const publishedEntry = await publishEntry(clientParams, entry);
    console.log(`Created and published Contact Section ${publishedEntry.sys.id}`);
    return publishedEntry;
  }

  existing.fields = { ...existing.fields, ...fields };
  const updatedEntry = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: existing.sys.id },
    existing
  );
  const publishedEntry = await publishEntry(clientParams, updatedEntry);
  console.log(`Updated and published Contact Section ${publishedEntry.sys.id}`);
  return publishedEntry;
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

async function addContactToHomePage(clientParams, homePage, contactSection) {
  const sections = Array.isArray(homePage.fields.sections?.[LOCALE])
    ? homePage.fields.sections[LOCALE]
    : [];
  const contactAlreadyPresent = sections.some((section) => section?.sys?.id === contactSection.sys.id);

  if (contactAlreadyPresent) {
    console.log(`Home Page ${homePage.sys.id} already includes Contact Section; skipping`);
    return;
  }

  homePage.fields.sections = {
    ...(homePage.fields.sections || {}),
    [LOCALE]: [...sections, getEntryLink(contactSection.sys.id)],
  };
  const updatedHomePage = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: homePage.sys.id },
    homePage
  );
  await publishEntry(clientParams, updatedHomePage);
  console.log(`Appended Contact Section and published Home Page ${updatedHomePage.sys.id}`);
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

  console.warn(
    `Using phone ${CONTACT_PHONE}: confirmed in the current Contact Section and Footer source; the (555) number is not seeded.`
  );
  const serviceTimeEntries = [];
  for (const serviceTime of serviceTimes) {
    serviceTimeEntries.push(await ensureServiceTime(clientParams, serviceTime));
  }

  const contactSection = await ensureContactSection(clientParams, serviceTimeEntries);
  const homePage = await findHomePage(clientParams, siteConfiguration);
  if (!homePage) {
    throw new Error('Hosanna Home Page was not found');
  }

  await addContactToHomePage(clientParams, homePage, contactSection);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  serviceTimes,
  contactSectionContent,
  buildContactSectionFields,
  main,
};
