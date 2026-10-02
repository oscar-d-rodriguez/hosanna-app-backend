const { createClient } = require('contentful-management');
require('dotenv').config();

const LOCALE = 'en-US';
const SPANISH_LOCALE = 'es';
const SITE_KEY = 'hosanna';
const SITE_LINK_CONTENT_TYPE = 'siteLink';
const SOCIAL_LINK_CONTENT_TYPE = 'siteSocialLink';
const SITE_CONFIGURATION_CONTENT_TYPE = 'siteConfiguration';

const siteLinks = [
  { internalName: 'Home', label: { 'en-US': 'Home', es: 'Inicio' }, href: '/#home' },
  { internalName: 'About', label: { 'en-US': 'About Us', es: 'Nosotros' }, href: '/#about' },
  { internalName: 'Ministries', label: { 'en-US': 'Ministries', es: 'Ministerios' }, href: '/#ministries' },
  { internalName: 'Youth', label: { 'en-US': 'Youth', es: 'Jóvenes' }, href: '/#youth' },
  { internalName: 'Events', label: { 'en-US': 'Events', es: 'Eventos' }, href: '/#events' },
  { internalName: 'Contact', label: { 'en-US': 'Contact', es: 'Contacto' }, href: '/#contact' },
  {
    internalName: 'Offering',
    label: { 'en-US': 'Giving', es: 'Ofrendar' },
    href: '/#offering',
    isOffering: true,
  },
];

const socialLinks = [
  {
    internalName: 'Facebook',
    platform: 'facebook',
    href: 'https://www.facebook.com/iglesiahosannabellevue/',
  },
  {
    internalName: 'Instagram',
    platform: 'instagram',
    href: 'https://www.instagram.com/iglesiahosannabellevue/',
  },
  {
    internalName: 'YouTube',
    platform: 'youtube',
    href: 'https://www.youtube.com/@IglesiaHosanna',
  },
];

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

function entryLink(id) {
  return { sys: { type: 'Link', linkType: 'Entry', id } };
}

async function findUniqueEntry(clientParams, contentType, internalName) {
  const response = await clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: {
      content_type: contentType,
      'fields.internalName': internalName,
      locale: LOCALE,
      limit: 1000,
    },
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
      {
        spaceId: clientParams.spaceId,
        environmentId: clientParams.environmentId,
        contentTypeId: contentType,
      },
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

async function ensureSiteLink(clientParams, siteLink) {
  const fields = {
    internalName: { [LOCALE]: siteLink.internalName },
    label: { [LOCALE]: siteLink.label[LOCALE], [SPANISH_LOCALE]: siteLink.label[SPANISH_LOCALE] },
    href: { [LOCALE]: siteLink.href },
    isOffering: { [LOCALE]: Boolean(siteLink.isOffering) },
  };
  return ensureEntry(clientParams, SITE_LINK_CONTENT_TYPE, siteLink.internalName, fields);
}

async function ensureSocialLink(clientParams, socialLink) {
  const fields = {
    internalName: { [LOCALE]: socialLink.internalName },
    platform: { [LOCALE]: socialLink.platform },
    href: { [LOCALE]: socialLink.href },
  };
  return ensureEntry(clientParams, SOCIAL_LINK_CONTENT_TYPE, socialLink.internalName, fields);
}

async function main() {
  const { spaceId, environmentId, managementToken } = getRequiredEnvironment();
  const client = createClient({ accessToken: managementToken });
  const clientParams = { client, spaceId, environmentId };

  await client.environment.get({ spaceId, environmentId });

  const siteResponse = await client.entry.getMany({
    spaceId,
    environmentId,
    query: {
      content_type: SITE_CONFIGURATION_CONTENT_TYPE,
      'fields.siteKey': SITE_KEY,
      locale: LOCALE,
      limit: 1,
    },
  });
  const siteConfiguration = siteResponse.items[0];
  if (!siteConfiguration) {
    throw new Error(`Site Configuration with siteKey ${SITE_KEY} was not found`);
  }

  const links = [];
  for (const siteLink of siteLinks) {
    links.push(await ensureSiteLink(clientParams, siteLink));
  }

  const socials = [];
  for (const socialLink of socialLinks) {
    socials.push(await ensureSocialLink(clientParams, socialLink));
  }

  const byName = new Map(links.map((entry, index) => [siteLinks[index].internalName, entry]));
  const navigationItems = ['Home', 'About', 'Ministries', 'Youth', 'Events', 'Contact', 'Offering']
    .map((name) => byName.get(name));
  const footerLinks = ['Home', 'About', 'Ministries', 'Youth', 'Events', 'Offering', 'Contact']
    .map((name) => byName.get(name));
  const fields = {
    navigationItems: { [LOCALE]: navigationItems.map((entry) => entryLink(entry.sys.id)) },
    offeringUrl: {
      [LOCALE]: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=iglesiahosannabellevue@gmail.com&item_name=Donation&currency_code=USD',
    },
    footerTagline: {
      [LOCALE]: 'A community of faith, hope, and love',
      [SPANISH_LOCALE]: 'Una comunidad de fe, esperanza y amor',
    },
    footerQuickLinksHeading: { [LOCALE]: 'Quick Links', [SPANISH_LOCALE]: 'Enlaces Rápidos' },
    footerConnectHeading: { [LOCALE]: 'Connect', [SPANISH_LOCALE]: 'Conéctate' },
    footerCopyright: { [LOCALE]: 'All rights reserved.', [SPANISH_LOCALE]: 'Todos los derechos reservados.' },
    footerLinks: { [LOCALE]: footerLinks.map((entry) => entryLink(entry.sys.id)) },
    footerSocialLinks: { [LOCALE]: socials.map((entry) => entryLink(entry.sys.id)) },
    footerAddress: { [LOCALE]: '15220 Main St, Bellevue, WA 98007' },
    footerPhone: { [LOCALE]: '(425) 644-6356' },
    footerEmail: { [LOCALE]: 'iglesia.hosanna@gmail.com' },
  };

  siteConfiguration.fields = { ...siteConfiguration.fields, ...fields };
  const updated = await client.entry.update(
    { spaceId, environmentId, entryId: siteConfiguration.sys.id },
    siteConfiguration
  );
  const published = await publishEntry(clientParams, updated);
  console.log(`Updated and published site navigation/footer configuration ${published.sys.id}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { siteLinks, socialLinks, main };
