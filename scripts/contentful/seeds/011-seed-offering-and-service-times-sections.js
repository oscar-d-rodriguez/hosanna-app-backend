const { createClient } = require('contentful-management');
require('dotenv').config();

const LOCALE = 'en-US';
const SPANISH_LOCALE = 'es';
const SITE_KEY = 'hosanna';
const HOME_PAGE_KEY = 'home';

const offeringPoints = [
  {
    internalName: 'Offering Point - Tithes and Offerings',
    icon: 'sparkles',
    title: { [LOCALE]: 'Tithes & Offerings', [SPANISH_LOCALE]: 'Diezmos y Ofrendas' },
    description: {
      [LOCALE]: 'Support the ministry, worship, and the ongoing work of the church.',
      [SPANISH_LOCALE]: 'Apoya el ministerio, la adoración y el trabajo continuo de la iglesia.',
    },
  },
  {
    internalName: 'Offering Point - Missions and Outreach',
    icon: 'heartHandshake',
    title: { [LOCALE]: 'Missions & Outreach', [SPANISH_LOCALE]: 'Misiones y Alcance' },
    description: {
      [LOCALE]: 'Help us reach people, serve families, and care for the community.',
      [SPANISH_LOCALE]: 'Ayúdanos a alcanzar personas, servir familias y cuidar a la comunidad.',
    },
  },
  {
    internalName: 'Offering Point - Building Fund',
    icon: 'landmark',
    title: { [LOCALE]: 'Building Fund', [SPANISH_LOCALE]: 'Fondo de Construcción' },
    description: {
      [LOCALE]: 'Contribute to the future growth and facilities of the church.',
      [SPANISH_LOCALE]: 'Contribuye al crecimiento futuro y a las instalaciones de la iglesia.',
    },
  },
];

const serviceScheduleItems = [
  {
    internalName: 'Service Schedule - Friday Bible Study',
    day: { [LOCALE]: 'Friday', [SPANISH_LOCALE]: 'Viernes' },
    time: { [LOCALE]: '7:00 PM', [SPANISH_LOCALE]: '7:00 PM' },
    description: { [LOCALE]: 'Bible Study', [SPANISH_LOCALE]: 'Estudio Bíblico' },
  },
  {
    internalName: 'Service Schedule - Sunday Service',
    day: { [LOCALE]: 'Sunday', [SPANISH_LOCALE]: 'Domingo' },
    time: { [LOCALE]: '2:00 PM', [SPANISH_LOCALE]: '2:00 PM' },
    description: { [LOCALE]: 'Service', [SPANISH_LOCALE]: 'Servicio de Gloria' },
  },
  {
    internalName: 'Service Schedule - Tuesday Prayer',
    day: { [LOCALE]: 'Tuesday', [SPANISH_LOCALE]: 'Martes' },
    time: { [LOCALE]: '7:00 PM', [SPANISH_LOCALE]: '7:00 PM' },
    description: { [LOCALE]: 'Prayer', [SPANISH_LOCALE]: 'Oración' },
  },
];

function getRequiredEnvironment() {
  const required = ['CONTENTFUL_SPACE_ID', 'CONTENTFUL_ENVIRONMENT_ID', 'CONTENTFUL_MANAGEMENT_TOKEN'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return {
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  };
}

function localized(values) {
  return { [LOCALE]: values[LOCALE], [SPANISH_LOCALE]: values[SPANISH_LOCALE] };
}

function entryLink(id) {
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
    throw new Error(`Found multiple ${contentType} entries named ${internalName}; refusing to choose one`);
  }
  return response.items[0] || null;
}

async function publishEntry(clientParams, entry) {
  return clientParams.client.entry.publish(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: entry.sys.id },
    entry
  );
}

async function ensureEntry(clientParams, contentType, internalName, fields) {
  const existing = await findUniqueEntry(clientParams, contentType, internalName);
  if (!existing) {
    const created = await clientParams.client.entry.create(
      { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, contentTypeId: contentType },
      { fields }
    );
    return publishEntry(clientParams, created);
  }

  existing.fields = { ...existing.fields, ...fields };
  const updated = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: existing.sys.id },
    existing
  );
  return publishEntry(clientParams, updated);
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

async function ensureOfferingSection(clientParams, pointEntries) {
  const fields = {
    internalName: { [LOCALE]: 'Hosanna Offering Section' },
    eyebrow: { [LOCALE]: 'Your Generosity Changes Lives', [SPANISH_LOCALE]: 'Tu Generosidad Cambia Vidas' },
    headline: { [LOCALE]: 'Give Generously', [SPANISH_LOCALE]: 'Da Generosamente' },
    description: {
      [LOCALE]: 'Your faithful giving helps us continue worship, outreach, discipleship, and care for our church family. Every gift makes a difference.',
      [SPANISH_LOCALE]: 'Tu generosidad nos ayuda a continuar la adoración, el alcance, el discipulado y el cuidado de nuestra familia iglesia. Cada donación hace una diferencia.',
    },
    cardEyebrow: { [LOCALE]: 'Give with purpose', [SPANISH_LOCALE]: 'Da con propósito' },
    cardHeadline: { [LOCALE]: 'Support the ministry today', [SPANISH_LOCALE]: 'Apoya al ministerio hoy' },
    cardDescription: {
      [LOCALE]: 'Your generosity helps us continue worship, discipleship, outreach, and care for our church family.',
      [SPANISH_LOCALE]: 'Tu generosidad nos ayuda a continuar la adoración, el discipulado, el alcance y el cuidado de nuestra familia iglesia.',
    },
    donateCtaLabel: { [LOCALE]: 'Donate with PayPal', [SPANISH_LOCALE]: 'Donar con PayPal' },
    donateCtaUrl: { [LOCALE]: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=iglesiahosannabellevue@gmail.com&item_name=Donation&currency_code=USD' },
    accountLabel: { [LOCALE]: 'PayPal account', [SPANISH_LOCALE]: 'Cuenta de PayPal' },
    accountValue: { [LOCALE]: 'iglesiahosannabellevue@gmail.com', [SPANISH_LOCALE]: 'iglesiahosannabellevue@gmail.com' },
    accountDescription: {
      [LOCALE]: 'If you prefer, you can also send your gift directly from your PayPal app or website.',
      [SPANISH_LOCALE]: 'Si lo prefieres, también puedes enviar tu ofrenda directamente desde tu app o sitio web de PayPal.',
    },
    givingPoints: { [LOCALE]: pointEntries.map((entry) => entryLink(entry.sys.id)) },
    thankYouHeading: { [LOCALE]: 'Every gift matters', [SPANISH_LOCALE]: 'Cada donación importa' },
    thankYouDescription: {
      [LOCALE]: 'Thank you for partnering with us in faith and generosity.',
      [SPANISH_LOCALE]: 'Gracias por asociarte con nosotros en fe y generosidad.',
    },
  };
  return ensureEntry(clientParams, 'offeringSection', 'Hosanna Offering Section', fields);
}

async function ensureServiceTimesSection(clientParams, scheduleEntries) {
  const fields = {
    internalName: { [LOCALE]: 'Hosanna Service Times Section' },
    eyebrow: { [LOCALE]: 'Join Us', [SPANISH_LOCALE]: 'Únete a Nosotros' },
    headline: { [LOCALE]: 'Service Times', [SPANISH_LOCALE]: 'Horarios de Servicio' },
    address: { [LOCALE]: '15220 Main St, Bellevue, WA 98007', [SPANISH_LOCALE]: '15220 Main St, Bellevue, WA 98007' },
    services: { [LOCALE]: scheduleEntries.map((entry) => entryLink(entry.sys.id)) },
  };
  return ensureEntry(clientParams, 'serviceTimesSection', 'Hosanna Service Times Section', fields);
}

async function appendSectionsToHomePage(clientParams, homePage, sectionEntries) {
  const sections = Array.isArray(homePage.fields.sections?.[LOCALE]) ? homePage.fields.sections[LOCALE] : [];
  const existingIds = new Set(sections.map((section) => section?.sys?.id));
  const missing = sectionEntries.filter((entry) => !existingIds.has(entry.sys.id));
  if (!missing.length) {
    return;
  }

  homePage.fields.sections = {
    ...(homePage.fields.sections || {}),
    [LOCALE]: [...sections, ...missing.map((entry) => entryLink(entry.sys.id))],
  };
  const updated = await clientParams.client.entry.update(
    { spaceId: clientParams.spaceId, environmentId: clientParams.environmentId, entryId: homePage.sys.id },
    homePage
  );
  await publishEntry(clientParams, updated);
}

async function main() {
  const { spaceId, environmentId, managementToken } = getRequiredEnvironment();
  const clientParams = { client: createClient({ accessToken: managementToken }), spaceId, environmentId };
  await clientParams.client.environment.get({ spaceId, environmentId });

  const siteConfiguration = await findSiteConfiguration(clientParams);
  const homePage = siteConfiguration && await findHomePage(clientParams, siteConfiguration);
  if (!homePage) {
    throw new Error('Hosanna Home Page was not found');
  }

  const pointEntries = [];
  for (const point of offeringPoints) {
    pointEntries.push(await ensureEntry(clientParams, 'offeringPoint', point.internalName, {
      internalName: { [LOCALE]: point.internalName },
      icon: { [LOCALE]: point.icon },
      title: localized(point.title),
      description: localized(point.description),
    }));
  }

  const scheduleEntries = [];
  for (const item of serviceScheduleItems) {
    scheduleEntries.push(await ensureEntry(clientParams, 'serviceScheduleItem', item.internalName, {
      internalName: { [LOCALE]: item.internalName },
      day: localized(item.day),
      time: localized(item.time),
      description: localized(item.description),
    }));
  }

  const offeringSection = await ensureOfferingSection(clientParams, pointEntries);
  const serviceTimesSection = await ensureServiceTimesSection(clientParams, scheduleEntries);
  await appendSectionsToHomePage(clientParams, homePage, [offeringSection, serviceTimesSection]);
  console.log('Published Offering and Service Times sections and linked them to Home Page');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { offeringPoints, serviceScheduleItems, main };
