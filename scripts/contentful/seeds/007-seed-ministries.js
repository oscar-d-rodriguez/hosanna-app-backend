const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('contentful-management');
require('dotenv').config();

const LOCALE = 'en-US';
const SPANISH_LOCALE = 'es';
const SITE_KEY = 'hosanna';
const MINISTRY_CONTENT_TYPE = 'ministry';
const MINISTRIES_SECTION_CONTENT_TYPE = 'ministriesSection';
const FRONTEND_ROOT = path.resolve(__dirname, '../../../../v0-church-website-design');

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

const ministries = [
  {
    slug: 'children',
    internalName: 'Children Ministry',
    icon: 'baby',
    title: { [LOCALE]: "Hosanna Kids: Children's Ministry", [SPANISH_LOCALE]: 'Ministerio de Niños: Hosanna Kids' },
    shortDescription: {
      [LOCALE]: "Nurturing young hearts with biblical teachings in a fun and safe environment.",
      [SPANISH_LOCALE]: 'Formando corazones para Cristo en un ambiente seguro, divertido y lleno de amor.',
    },
    detailDescription: {
      [LOCALE]: "Our Children's Ministry provides a safe, fun, and faith-filled environment for kids to learn about Jesus. Through engaging Bible classes and activities, we help children grow in their relationship with God.",
      [SPANISH_LOCALE]: 'Nuestro Ministerio de Niños proporciona un ambiente seguro, divertido y lleno de fe para que los niños aprendan sobre Jesús. A través de clases bíblicas interesantes y actividades, ayudamos a los niños a crecer en su relación con Dios.',
    },
    heroImage: 'public/images/ministries/image5.jpeg',
    leaderImage: 'public/images/ministries/image4.jpeg',
    leaderName: 'Stephanie Tapia',
    leaderRoleLabel: { [LOCALE]: 'Director', [SPANISH_LOCALE]: 'Directora' },
    whatWeDoItems: {
      [LOCALE]: ['Bible Classes Every Sunday', 'Bible Stories & Teachings', 'Games & Fun Activities', 'Child Development in Faith'],
      [SPANISH_LOCALE]: ['Clases Bíblicas Todos los Domingos', 'Historias y Enseñanzas Bíblicas', 'Juegos y Actividades Divertidas', 'Desarrollo Infantil en la Fe'],
    },
    schedule: { [LOCALE]: 'Every Sunday', [SPANISH_LOCALE]: 'Todos los Domingos' },
    contactEmail: 'aletapia1507@gmail.com',
    joinCtaHeading: { [LOCALE]: 'Ready to Join?', [SPANISH_LOCALE]: '¿Listo para Unirte?' },
    joinCtaDescription: {
      [LOCALE]: 'We would love to have you serve with us! Contact us today to get started.',
      [SPANISH_LOCALE]: '¡Nos encantaría que sirvieras con nosotros! Contáctanos hoy para comenzar.',
    },
    joinCtaLabel: { [LOCALE]: 'Contact Us Now', [SPANISH_LOCALE]: 'Contactanos Ahora' },
  },
  {
    slug: 'men',
    internalName: "Men's Ministry",
    icon: 'users',
    title: { [LOCALE]: "Men's Ministry", [SPANISH_LOCALE]: 'Ministerio de Varones' },
    shortDescription: {
      [LOCALE]: "Building strong men of faith through fellowship and spiritual growth.",
      [SPANISH_LOCALE]: 'Fortaleciendo a los hombres en la fe mediante la comunión y el crecimiento espiritual.',
    },
    detailDescription: {
      [LOCALE]: "Our Men's Ministry exists to help men grow as spiritual leaders in their homes, workplaces, and community. Through fellowship, camping trips, and church activities, we equip men to live with purpose and integrity.",
      [SPANISH_LOCALE]: 'Nuestro Ministerio de Varones existe para ayudar a los hombres a crecer como líderes espirituales en sus hogares, lugares de trabajo y comunidad. A través de la comunión, viajes de campamento y actividades de iglesia, equipamos a los hombres para vivir con propósito e integridad.',
    },
    heroImage: 'public/images/ministries/image7.jpeg',
    leaderImage: 'public/images/ministries/image6.jpeg',
    leaderName: 'Pedro Lazo',
    leaderRoleLabel: { [LOCALE]: 'Director', [SPANISH_LOCALE]: 'Director' },
    whatWeDoItems: {
      [LOCALE]: ["Men's Camping Trips", 'Support for Sons & Young Men', 'Church Activity Support', 'Spiritual Leadership Development'],
      [SPANISH_LOCALE]: ['Viajes de Campamento para Hombres', 'Apoyo para Hijos y Jóvenes Hombres', 'Apoyo en Actividades de la Iglesia', 'Desarrollo del Liderazgo Espiritual'],
    },
    schedule: { [LOCALE]: 'Various times and special events', [SPANISH_LOCALE]: 'Varios horarios y eventos especiales' },
    contactEmail: 'pedrolazo76401@gmail.com',
    joinCtaHeading: { [LOCALE]: 'Ready to Join?', [SPANISH_LOCALE]: '¿Listo para Unirte?' },
    joinCtaDescription: {
      [LOCALE]: 'We would love to have you serve with us! Contact us today to get started.',
      [SPANISH_LOCALE]: '¡Nos encantaría que sirvieras con nosotros! Contáctanos hoy para comenzar.',
    },
    joinCtaLabel: { [LOCALE]: 'Contact Us Now', [SPANISH_LOCALE]: 'Contactanos Ahora' },
  },
  {
    slug: 'women',
    internalName: "Women's Ministry",
    icon: 'userCircle',
    title: { [LOCALE]: "Women's Ministry", [SPANISH_LOCALE]: 'Ministerio de Mujeres' },
    shortDescription: {
      [LOCALE]: 'Empowering women to grow in faith and support one another.',
      [SPANISH_LOCALE]: 'Animando a las mujeres a crecer en su relación con Dios y apoyarse unas a otras.',
    },
    detailDescription: {
      [LOCALE]: "Our Women's Ministry provides opportunities for women to connect, grow, and serve together. Through fellowship events, kitchen service, and community activities, we encourage women to deepen their faith and support one another.",
      [SPANISH_LOCALE]: 'Nuestro Ministerio de Mujeres brinda oportunidades para que las mujeres se conecten, crezcan y sirvan juntas. A través de eventos de comunión, servicio en la cocina y actividades comunitarias, alentamos a las mujeres a profundizar su fe y apoyarse mutuamente.',
    },
    heroImage: 'public/images/ministries/image9.jpeg',
    leaderImage: 'public/images/ministries/image8.jpeg',
    leaderName: 'María José Avilés',
    leaderRoleLabel: { [LOCALE]: 'Director', [SPANISH_LOCALE]: 'Directora' },
    whatWeDoItems: {
      [LOCALE]: ['Fellowship Events & Gatherings', 'Kitchen Service & Food Ministry', 'Refreshment Preparation', 'Community & Church Support'],
      [SPANISH_LOCALE]: ['Eventos de Comunión y Encuentros', 'Servicio en la Cocina y Ministerio de Alimentos', 'Preparación de Refrescos', 'Apoyo Comunitario e Iglesia'],
    },
    schedule: { [LOCALE]: 'Various times and seasonal events', [SPANISH_LOCALE]: 'Varios horarios y eventos estacionales' },
    contactEmail: 'mariajoseaviles.mja@gmail.com',
    joinCtaHeading: { [LOCALE]: 'Ready to Join?', [SPANISH_LOCALE]: '¿Listo para Unirte?' },
    joinCtaDescription: {
      [LOCALE]: 'We would love to have you serve with us! Contact us today to get started.',
      [SPANISH_LOCALE]: '¡Nos encantaría que sirvieras con nosotros! Contáctanos hoy para comenzar.',
    },
    joinCtaLabel: { [LOCALE]: 'Contact Us Now', [SPANISH_LOCALE]: 'Contactanos Ahora' },
  },
  {
    slug: 'outreach',
    internalName: 'Outreach Ministry',
    icon: 'globe',
    title: { [LOCALE]: 'Outreach Ministry', [SPANISH_LOCALE]: 'Ministerio de Consolidación' },
    shortDescription: {
      [LOCALE]: 'Serving our community with love and meeting practical needs.',
      [SPANISH_LOCALE]: 'Sirviendo a nuestra comunidad con amor y atendiendo necesidades prácticas.',
    },
    detailDescription: {
      [LOCALE]: 'Our Consolidation Ministry focuses on discipleship and evangelism, helping new believers grow in their faith. We conduct temple visits, provide personal mentorship, and conduct outreach initiatives throughout the year.',
      [SPANISH_LOCALE]: 'Nuestro Ministerio de Consolidación se enfoca en el discipulado y el evangelismo, ayudando a los nuevos creyentes a crecer en su fe. Realizamos visitas al templo, ofrecemos mentoría personal e iniciativas de alcance durante todo el año.',
    },
    heroImage: 'public/images/ministries/image11.jpeg',
    leaderImage: 'public/images/ministries/image10.jpeg',
    leaderName: 'Sheila Garcia',
    leaderRoleLabel: { [LOCALE]: 'Director', [SPANISH_LOCALE]: 'Directora' },
    whatWeDoItems: {
      [LOCALE]: ['Temple Visits & Follow-up', 'Evangelism & Outreach', 'Discipleship & Mentoring', 'New Believer Support'],
      [SPANISH_LOCALE]: ['Visitas al Templo y Seguimiento', 'Evangelismo y Alcance', 'Discipulado y Mentoría', 'Apoyo a Nuevos Creyentes'],
    },
    schedule: { [LOCALE]: 'Multiple visits per year', [SPANISH_LOCALE]: 'Múltiples visitas por año' },
    contactEmail: 'gahes78@hotmail.com',
    joinCtaHeading: { [LOCALE]: 'Ready to Join?', [SPANISH_LOCALE]: '¿Listo para Unirte?' },
    joinCtaDescription: {
      [LOCALE]: 'We would love to have you serve with us! Contact us today to get started.',
      [SPANISH_LOCALE]: '¡Nos encantaría que sirvieras con nosotros! Contáctanos hoy para comenzar.',
    },
    joinCtaLabel: { [LOCALE]: 'Contact Us Now', [SPANISH_LOCALE]: 'Contactanos Ahora' },
  },
  {
    slug: 'prayer',
    internalName: 'Prayer Ministry',
    icon: 'handHeart',
    title: { [LOCALE]: 'Intercession & Evangelism Ministry', [SPANISH_LOCALE]: 'Ministerio de Intercesión y Evangelismo' },
    shortDescription: {
      [LOCALE]: 'Interceding for our church, community, and world through dedicated prayer.',
      [SPANISH_LOCALE]: 'Intercediendo por nuestra iglesia, nuestra comunidad y el mundo mediante la oración.',
    },
    detailDescription: {
      [LOCALE]: 'Our Intercession and Evangelism Ministry is the heartbeat of our church. We believe in the power of prayer and are committed to interceding for our church, community, and world through consistent prayer gatherings.',
      [SPANISH_LOCALE]: 'Nuestro Ministerio de Intercesión y Evangelismo es el corazón de nuestra iglesia. Creemos en el poder de la oración y estamos comprometidos a interceder por nuestra iglesia, comunidad y mundo a través de reuniones constantes de oración.',
    },
    heroImage: 'public/images/ministries/image13.jpeg',
    leaderImage: 'public/images/ministries/image12.jpeg',
    leaderName: 'Juan Carlos Velazquez',
    leaderRoleLabel: { [LOCALE]: 'Director', [SPANISH_LOCALE]: 'Director' },
    whatWeDoItems: {
      [LOCALE]: [
        "Morning Devotionals 'Amaneciendo con Dios' Tuesday and Thursday, 5:00-6:00 AM",
        'Women Intercessors of Faith Wednesday, 5:00-6:00 AM',
        'Prayer Nights Monday, Wednesday, and Thursday, 8:00-8:30 PM',
      ],
      [SPANISH_LOCALE]: [
        "Devocionales Matutinos 'Amaneciendo con Dios' Martes y Jueves, 5:00-6:00 AM",
        'Mujeres Intercesoras de Fe Miércoles, 5:00-6:00 AM',
        'Noches de Oración Lunes, Miércoles y Jueves, 8:00-8:30 PM',
      ],
    },
    schedule: {
      [LOCALE]: 'Tuesday and Thursday 5:00-5:30 AM, Wednesday 5:00-6:00 AM, and Monday/Wednesday/Thursday 8:00-8:30 PM (Zoom)',
      [SPANISH_LOCALE]: 'Martes y Jueves 5:00-5:30 AM, Miércoles 5:00-6:00 AM, y Lunes/Miércoles/Jueves 8:00-8:30 PM (Zoom)',
    },
    contactEmail: 'juanc76543@gmail.com',
    joinCtaHeading: { [LOCALE]: 'Ready to Join?', [SPANISH_LOCALE]: '¿Listo para Unirte?' },
    joinCtaDescription: {
      [LOCALE]: 'We would love to have you serve with us! Contact us today to get started.',
      [SPANISH_LOCALE]: '¡Nos encantaría que sirvieras con nosotros! Contáctanos hoy para comenzar.',
    },
    joinCtaLabel: { [LOCALE]: 'Contact Us Now', [SPANISH_LOCALE]: 'Contactanos Ahora' },
  },
];

function getLocalizedFields(values) {
  return { [LOCALE]: values[LOCALE], [SPANISH_LOCALE]: values[SPANISH_LOCALE] };
}

function getLink(id) {
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

async function findAsset(clientParams, fileName) {
  const response = await clientParams.client.asset.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: { limit: 1000 },
  });
  return response.items.find((asset) => {
    const file = asset.fields?.file?.[LOCALE];
    return file?.fileName === fileName;
  }) || null;
}

async function ensureAsset(clientParams, relativePath) {
  const fileName = getAssetFileName(relativePath);
  const existing = await findAsset(clientParams, fileName);
  if (existing) {
    console.log(`Asset ${fileName} already exists; reusing ${existing.sys.id}`);
    return existing;
  }

  const localPath = getLocalAssetPath(relativePath);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Required frontend asset does not exist: ${localPath}`);
  }

  const contentType = path.extname(fileName).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  const asset = await clientParams.client.asset.createFromFiles(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
    },
    {
      fields: {
        title: { [LOCALE]: fileName },
        file: {
          [LOCALE]: {
            contentType,
            fileName,
            file: fs.createReadStream(localPath),
          },
        },
      },
    },
  );

  const processedAsset = await clientParams.client.asset.processForAllLocales(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
    },
    asset
  );
  const publishedAsset = await clientParams.client.asset.publish(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
      assetId: processedAsset.sys.id,
    },
    processedAsset
  );
  console.log(`Created and published asset ${fileName} as ${publishedAsset.sys.id}`);
  return publishedAsset;
}

async function findSiteConfiguration(clientParams) {
  const response = await clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: {
      content_type: 'siteConfiguration',
      'fields.siteKey': SITE_KEY,
      locale: LOCALE,
      limit: 1,
    },
  });
  return response.items[0] || null;
}

async function findMinistry(clientParams, siteConfigurationId, slug) {
  const response = await clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: {
      content_type: MINISTRY_CONTENT_TYPE,
      'fields.siteConfiguration.sys.id': siteConfigurationId,
      'fields.slug': slug,
      locale: LOCALE,
      limit: 1,
    },
  });
  return response.items[0] || null;
}

function getSiteConfigurationId(entry) {
  return entry.fields?.siteConfiguration?.[LOCALE]?.sys?.id || null;
}

async function resolveWorshipMinistry(clientParams, siteConfiguration) {
  const tenantResponse = await clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: {
      content_type: MINISTRY_CONTENT_TYPE,
      'fields.siteConfiguration.sys.id': siteConfiguration.sys.id,
      'fields.slug': 'worship',
      locale: LOCALE,
      limit: 1,
    },
  });
  const tenantMatch = tenantResponse.items[0] || null;
  if (tenantMatch) {
    return tenantMatch;
  }

  const worshipResponse = await clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: {
      content_type: MINISTRY_CONTENT_TYPE,
      'fields.slug': 'worship',
      locale: LOCALE,
      limit: 1000,
    },
  });
  const worshipEntries = worshipResponse.items || [];

  if (worshipEntries.length > 1) {
    throw new Error(
      `Found ${worshipEntries.length} Worship Ministries; refusing to guess which entry belongs to ${SITE_KEY}`
    );
  }

  const worship = worshipEntries[0] || null;
  if (!worship) {
    throw new Error('Existing Worship Ministry was not found; refusing to create it');
  }

  const worshipSiteConfigurationId = getSiteConfigurationId(worship);
  if (worshipSiteConfigurationId && worshipSiteConfigurationId !== siteConfiguration.sys.id) {
    throw new Error(
      `Worship Ministry ${worship.sys.id} belongs to Site Configuration ${worshipSiteConfigurationId}; refusing to modify it`
    );
  }

  if (worshipSiteConfigurationId === siteConfiguration.sys.id) {
    console.log(`Reusing existing Worship Ministry ${worship.sys.id}; tenant reference already matches`);
    return worship;
  }

  worship.fields.siteConfiguration = {
    ...(worship.fields.siteConfiguration || {}),
    [LOCALE]: getLink(siteConfiguration.sys.id),
  };
  const repairedWorship = await clientParams.client.entry.update(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
      entryId: worship.sys.id,
    },
    worship
  );
  const publishedWorship = await clientParams.client.entry.publish(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
      entryId: repairedWorship.sys.id,
    },
    repairedWorship
  );
  console.log(
    `Repaired and reused existing Worship Ministry ${publishedWorship.sys.id} by linking it to Site Configuration ${siteConfiguration.sys.id}`
  );
  return publishedWorship;
}

function buildMinistryFields(ministry, siteConfiguration, heroAsset, leaderAsset) {
  return {
    internalName: { [LOCALE]: ministry.internalName },
    siteConfiguration: { [LOCALE]: getLink(siteConfiguration.sys.id) },
    slug: { [LOCALE]: ministry.slug },
    icon: { [LOCALE]: ministry.icon },
    title: getLocalizedFields(ministry.title),
    shortDescription: getLocalizedFields(ministry.shortDescription),
    detailDescription: getLocalizedFields(ministry.detailDescription),
    heroImage: { [LOCALE]: getAssetLink(heroAsset.sys.id) },
    heroImageAltText: {
      [LOCALE]: ministry.title[LOCALE],
      [SPANISH_LOCALE]: ministry.title[SPANISH_LOCALE],
    },
    leaderName: { [LOCALE]: ministry.leaderName },
    leaderImage: { [LOCALE]: getAssetLink(leaderAsset.sys.id) },
    leaderImageAltText: {
      [LOCALE]: ministry.leaderName,
      [SPANISH_LOCALE]: ministry.leaderName,
    },
    leaderRoleLabel: getLocalizedFields(ministry.leaderRoleLabel),
    whatWeDoItems: getLocalizedFields(ministry.whatWeDoItems),
    schedule: getLocalizedFields(ministry.schedule),
    contactEmail: { [LOCALE]: ministry.contactEmail },
    joinCtaHeading: getLocalizedFields(ministry.joinCtaHeading),
    joinCtaDescription: getLocalizedFields(ministry.joinCtaDescription),
    joinCtaLabel: getLocalizedFields(ministry.joinCtaLabel),
  };
}

async function createMissingMinistries(clientParams, siteConfiguration) {
  const entries = new Map();

  for (const ministry of ministries) {
    const existing = await findMinistry(clientParams, siteConfiguration.sys.id, ministry.slug);
    if (existing) {
      console.log(`Ministry ${ministry.slug} already exists; skipping`);
      entries.set(ministry.slug, existing);
      continue;
    }

    const heroAsset = await ensureAsset(clientParams, ministry.heroImage);
    const leaderAsset = await ensureAsset(clientParams, ministry.leaderImage);
    const entry = await clientParams.client.entry.create(
      {
        spaceId: clientParams.spaceId,
        environmentId: clientParams.environmentId,
        contentTypeId: MINISTRY_CONTENT_TYPE,
      },
      { fields: buildMinistryFields(ministry, siteConfiguration, heroAsset, leaderAsset) }
    );

    const publishedEntry = await clientParams.client.entry.publish(
      {
        spaceId: clientParams.spaceId,
        environmentId: clientParams.environmentId,
        entryId: entry.sys.id,
      },
      entry
    );
    console.log(`Created and published Ministry ${ministry.slug} as ${publishedEntry.sys.id}`);
    entries.set(ministry.slug, publishedEntry);
  }

  return entries;
}

async function updateMinistriesSection(clientParams, siteConfiguration, ministryEntries) {
  const response = await clientParams.client.entry.getMany({
    spaceId: clientParams.spaceId,
    environmentId: clientParams.environmentId,
    query: {
      content_type: MINISTRIES_SECTION_CONTENT_TYPE,
      limit: 1,
    },
  });
  const section = response.items[0] || null;
  if (!section) {
    throw new Error('Could not find the existing Ministries Section entry');
  }

  const worship = await resolveWorshipMinistry(clientParams, siteConfiguration);

  const orderedEntries = [worship, ...ministries.map((ministry) => ministryEntries.get(ministry.slug))];
  section.fields.ministries = {
    ...(section.fields.ministries || {}),
    [LOCALE]: orderedEntries.map((entry) => getLink(entry.sys.id)),
  };
  const updatedSection = await clientParams.client.entry.update(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
      entryId: section.sys.id,
    },
    section
  );
  await clientParams.client.entry.publish(
    {
      spaceId: clientParams.spaceId,
      environmentId: clientParams.environmentId,
      entryId: updatedSection.sys.id,
    },
    updatedSection
  );
  console.log(`Updated and published Ministries Section ${updatedSection.sys.id}`);
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

  console.log(`Using Site Configuration ${siteConfiguration.sys.id} for ${SITE_KEY}`);
  const ministryEntries = await createMissingMinistries(clientParams, siteConfiguration);
  await updateMinistriesSection(clientParams, siteConfiguration, ministryEntries);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  ministries,
  buildMinistryFields,
  getLocalAssetPath,
  main,
};
