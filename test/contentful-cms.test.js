const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentfulService } = require('../src/services/contentful.service');
const { createCmsService } = require('../src/services/cms.service');

function createMockCache() {
  const store = new Map();

  return {
    store,
    get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    set(key, value) {
      store.set(key, value);
    },
    deleteByPrefix(prefix) {
      for (const key of [...store.keys()]) {
        if (key.startsWith(prefix)) {
          store.delete(key);
        }
      }
    },
  };
}

function createConfiguredContentfulEnvironment() {
  return {
    contentful: {
      spaceId: 'space-id',
      environmentId: 'master',
      deliveryToken: 'delivery-token',
      previewToken: 'preview-token',
      siteKey: 'hosanna',
    },
  };
}

function createMediaAsset(url = '//images.ctfassets.net/ministry.jpg') {
  return {
    fields: {
      title: ' Ministry image ',
      description: ' Image description ',
      file: {
        url,
        contentType: 'image/jpeg',
        details: { image: { width: 1200, height: 800 } },
      },
    },
  };
}

function createMinistryEntry(overrides = {}) {
  return {
    sys: { id: 'ministry-worship' },
    fields: {
      slug: 'worship',
      icon: 'music',
      title: ' Worship Ministry ',
      shortDescription: ' Worship together. ',
      detailDescription: ' We lead worship and train musicians. ',
      heroImage: createMediaAsset(),
      heroImageAltText: ' Worship team ',
      leaderName: ' Maria ',
      leaderImage: createMediaAsset('//images.ctfassets.net/leader.jpg'),
      leaderImageAltText: ' Ministry leader ',
      leaderRoleLabel: ' Director ',
      whatWeDoItems: [' Rehearsals ', '   ', ' Sunday worship ', 'Instrument classes'],
      schedule: ' Sundays ',
      contactEmail: ' worship@example.com ',
      joinCtaHeading: ' Join us ',
      joinCtaDescription: ' Serve with us. ',
      joinCtaLabel: ' Contact us ',
      ...overrides,
    },
  };
}

function createDefaultSeoEntry() {
  return {
    fields: {
      pageTitle: ' Default Ministry SEO ',
      description: ' Default description ',
      socialTitle: ' Default social title ',
      socialDescription: ' Default social description ',
      hideFromSearchEngines: false,
    },
  };
}

test('mapAsset produces an absolute HTTPS URL from a protocol-relative Contentful URL', () => {
  const service = createContentfulService();

  const result = service.mapAsset({
    fields: {
      file: {
        url: '//images.ctfassets.net/eo9prlow/image/upload/v1/example.jpg',
      },
    },
  });

  assert.equal(result, 'https://images.ctfassets.net/eo9prlow/image/upload/v1/example.jpg');
});

test('SEO fallback maps socialTitle from pageTitle when socialTitle is missing', () => {
  const service = createContentfulService();

  const result = service.normalizeSeoMetadata({
    fields: {
      pageTitle: 'Hosanna Church',
      description: 'A church family',
    },
  });

  assert.equal(result.pageTitle, 'Hosanna Church');
  assert.equal(result.socialTitle, 'Hosanna Church');
});

test('SEO fallback maps socialDescription from description when socialDescription is missing', () => {
  const service = createContentfulService();

  const result = service.normalizeSeoMetadata({
    fields: {
      pageTitle: 'Hosanna Church',
      description: 'A church family',
    },
  });

  assert.equal(result.description, 'A church family');
  assert.equal(result.socialDescription, 'A church family');
});

test('Site Configuration maps organization, navigation, footer, and SEO content', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
      organizationDescription: 'A bilingual church in Bellevue.',
      organizationLogo: {
        fields: {
          title: 'Hosanna Logo',
          description: 'Primary brand mark',
          file: {
            url: '//images.ctfassets.net/eo9prlow/logo.png',
            contentType: 'image/png',
            details: {
              image: {
                width: 640,
                height: 320,
              },
            },
          },
        },
      },
      defaultSeoMetadata: {
        fields: {
          pageTitle: 'Hosanna Church',
          description: 'A bilingual church in Bellevue.',
          socialImage: {
            fields: {
              title: 'Social Image',
              description: 'Open graph image',
              file: {
                url: '//images.ctfassets.net/eo9prlow/social.jpg',
                contentType: 'image/jpeg',
                details: {
                  image: {
                    width: 1200,
                    height: 630,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  assert.deepEqual(result, {
    internalName: 'Main site configuration',
    siteKey: 'hosanna-main',
    organizationName: 'Hosanna Church',
    organizationDescription: 'A bilingual church in Bellevue.',
    organizationLogo: {
      url: 'https://images.ctfassets.net/eo9prlow/logo.png',
      title: 'Hosanna Logo',
      description: 'Primary brand mark',
      width: 640,
      height: 320,
      contentType: 'image/png',
    },
    navigationItems: [],
    offeringUrl: null,
    footer: {
      tagline: null,
      quickLinksHeading: null,
      connectHeading: null,
      copyright: null,
      quickLinks: [],
      socialLinks: [],
      contactInfo: { address: null, phone: null, email: null },
    },
    defaultSeoMetadata: {
      pageTitle: 'Hosanna Church',
      description: 'A bilingual church in Bellevue.',
      socialTitle: 'Hosanna Church',
      socialDescription: 'A bilingual church in Bellevue.',
      socialImage: {
        url: 'https://images.ctfassets.net/eo9prlow/social.jpg',
        title: 'Social Image',
        description: 'Open graph image',
        width: 1200,
        height: 630,
        contentType: 'image/jpeg',
      },
      hideFromSearchEngines: false,
    },
  });
});

test('optional organizationDescription can be absent', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
    },
  });

  assert.equal(Object.hasOwn(result, 'organizationDescription'), false);
});

test('optional text fields trim trailing newlines and spaces', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
      organizationDescription: 'Una iglesia sin limites\n',
      organizationLogo: {
        fields: {
          title: 'Hosanna Logo',
          description: 'Brand mark\n',
          file: {
            url: '//images.ctfassets.net/eo9prlow/logo.png',
            contentType: 'image/png',
            details: {
              image: {
                width: 640,
                height: 320,
              },
            },
          },
        },
      },
      defaultSeoMetadata: {
        fields: {
          pageTitle: 'Hosanna Church',
          description: 'A church family',
          socialTitle: ' Hosanna Social\n',
          socialDescription: ' Social description\n',
        },
      },
    },
  });

  assert.equal(result.organizationDescription, 'Una iglesia sin limites');
  assert.equal(result.organizationLogo.description, 'Brand mark');
  assert.equal(result.defaultSeoMetadata.socialTitle, 'Hosanna Social');
  assert.equal(result.defaultSeoMetadata.socialDescription, 'Social description');
});

test('Site Configuration normalizes ordered links, social profiles, and rejects unsafe URLs', () => {
  const service = createContentfulService();
  const result = service.normalizeSiteConfiguration({
    fields: {
      navigationItems: [
        { fields: { label: ' Ministries ', href: '/#ministries' } },
        { fields: { label: ' Unsafe ', href: 'javascript:alert(1)' } },
      ],
      offeringUrl: ' https://giving.example.org/ ' ,
      footerTagline: ' Faith and hope ',
      footerQuickLinksHeading: ' Quick Links ',
      footerConnectHeading: ' Connect ',
      footerCopyright: ' All rights reserved. ',
      footerLinks: [{ fields: { label: ' Contact ', href: '/#contact' } }],
      footerSocialLinks: [
        { fields: { platform: 'facebook', href: 'https://facebook.com/example' } },
        { fields: { platform: 'unknown', href: 'https://example.org' } },
        { fields: { platform: 'youtube', href: 'http://youtube.com/example' } },
      ],
      footerAddress: ' 15220 Main St ',
      footerPhone: ' (425) 644-6356 ',
      footerEmail: ' hello@example.org ',
    },
  });

  assert.deepEqual(result.navigationItems, [
    { label: 'Ministries', href: '/#ministries', isOffering: false },
  ]);
  assert.equal(result.offeringUrl, 'https://giving.example.org/');
  assert.deepEqual(result.footer, {
    tagline: 'Faith and hope',
    quickLinksHeading: 'Quick Links',
    connectHeading: 'Connect',
    copyright: 'All rights reserved.',
    quickLinks: [{ label: 'Contact', href: '/#contact', isOffering: false }],
    socialLinks: [{ platform: 'facebook', href: 'https://facebook.com/example' }],
    contactInfo: {
      address: '15220 Main St',
      phone: '(425) 644-6356',
      email: 'hello@example.org',
    },
  });
});

test('whitespace-only optional values normalize to null or fallback values', () => {
  const service = createContentfulService();

  const result = service.normalizeSiteConfiguration({
    fields: {
      internalName: 'Main site configuration',
      siteKey: 'hosanna-main',
      organizationName: 'Hosanna Church',
      organizationDescription: '   \n\t ',
      organizationLogo: {
        fields: {
          title: 'Hosanna Logo',
          description: '   \n',
          file: {
            url: '//images.ctfassets.net/eo9prlow/logo.png',
            contentType: 'image/png',
            details: {
              image: {
                width: 640,
                height: 320,
              },
            },
          },
        },
      },
      defaultSeoMetadata: {
        fields: {
          pageTitle: 'Hosanna Church',
          description: 'A church family',
          socialTitle: '   \n',
          socialDescription: '\t\n',
        },
      },
    },
  });

  assert.equal(Object.hasOwn(result, 'organizationDescription'), false);
  assert.equal(result.organizationLogo.description, null);
  assert.equal(result.defaultSeoMetadata.socialTitle, 'Hosanna Church');
  assert.equal(result.defaultSeoMetadata.socialDescription, 'A church family');
});

test('Page section mapper normalizes hero sections with shared content mode', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      pageKey: 'home',
      title: 'Home',
      slug: '',
      seoMetadata: {
        fields: {
          pageTitle: 'Home',
          description: 'Welcome',
        },
      },
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            headline: '  Bienvenidos a Hosanna  ',
            subheadline: ' Una familia en Cristo\n',
            primaryCtaLabel: ' Plan Your Visit ',
            primaryCtaUrl: ' /visit ',
            slides: [
              {
                fields: {
                  image: {
                    fields: {
                      file: {
                        url: '//images.ctfassets.net/hero-one.jpg',
                      },
                    },
                  },
                  imageAltText: ' Congregation worshiping ',
                  headline: 'Ignored slide headline',
                  subheadline: 'Ignored slide subheadline',
                  primaryCtaLabel: 'Ignored CTA',
                  primaryCtaUrl: '/ignored',
                },
              },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections, [
    {
      type: 'hero',
      contentMode: 'shared',
      headline: 'Bienvenidos a Hosanna',
      subheadline: 'Una familia en Cristo',
      primaryCtaLabel: 'Plan Your Visit',
      primaryCtaUrl: '/visit',
      slides: [
        {
          image: 'https://images.ctfassets.net/hero-one.jpg',
          imageAltText: 'Congregation worshiping',
        },
      ],
    },
  ]);
});

test('Page section mapper normalizes hero sections with perSlide content mode', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      pageKey: 'home',
      title: 'Home',
      slug: '',
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'perSlide',
            headline: 'Ignored section headline',
            subheadline: 'Ignored section subheadline',
            primaryCtaLabel: 'Ignored CTA',
            primaryCtaUrl: '/ignored',
            slides: [
              {
                fields: {
                  image: {
                    fields: {
                      file: {
                        url: '//images.ctfassets.net/hero-per-slide.jpg',
                      },
                    },
                  },
                  imageAltText: ' Family worship ',
                  headline: ' Discover Community ',
                  subheadline: ' Join us this Sunday ',
                  primaryCtaLabel: ' Learn More ',
                  primaryCtaUrl: 'https://example.org/ministries ',
                },
              },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections, [
    {
      type: 'hero',
      contentMode: 'perSlide',
      headline: null,
      subheadline: null,
      primaryCtaLabel: null,
      primaryCtaUrl: null,
      slides: [
        {
          image: 'https://images.ctfassets.net/hero-per-slide.jpg',
          imageAltText: 'Family worship',
          headline: 'Discover Community',
          subheadline: 'Join us this Sunday',
          primaryCtaLabel: 'Learn More',
          primaryCtaUrl: 'https://example.org/ministries',
        },
      ],
    },
  ]);
});

test('invalid or missing hero contentMode defaults to shared and logs a warning', () => {
  const warnings = [];
  const service = createContentfulService({
    logger: {
      warn(payload, message) {
        warnings.push({ payload, message });
      },
    },
  });

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'unsupported-mode',
            slides: [],
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].contentMode, 'shared');
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].message, 'Unsupported hero contentMode; defaulting to shared');
});

test('hero slides preserve Contentful reference order', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      pageKey: 'home',
      title: 'Home',
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            slides: [
              {
                fields: {
                  image: {
                    fields: {
                      file: {
                        url: '//images.ctfassets.net/slide-2.jpg',
                      },
                    },
                  },
                  imageAltText: 'Second',
                },
              },
              {
                fields: {
                  image: {
                    fields: {
                      file: {
                        url: '//images.ctfassets.net/slide-1.jpg',
                      },
                    },
                  },
                  imageAltText: 'First',
                },
              },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections[0].slides.map((slide) => slide.imageAltText), ['Second', 'First']);
});

test('hero CTA does not expose partial values when label or URL is missing', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            primaryCtaLabel: 'Visit Us',
            primaryCtaUrl: '   ',
            slides: [],
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].primaryCtaLabel, null);
  assert.equal(page.sections[0].primaryCtaUrl, null);
});

test('unsafe hero CTA URL is rejected and returned as null CTA pair', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            primaryCtaLabel: 'Click Me',
            primaryCtaUrl: 'javascript:alert(1)',
            slides: [],
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].primaryCtaLabel, null);
  assert.equal(page.sections[0].primaryCtaUrl, null);
});

test('localized hero text is preserved during normalization', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            headline: 'Bienvenidos',
            subheadline: 'Una iglesia para todos',
            primaryCtaLabel: 'Planifica Tu Visita',
            primaryCtaUrl: '/es/visitanos',
            slides: [],
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].headline, 'Bienvenidos');
  assert.equal(page.sections[0].subheadline, 'Una iglesia para todos');
  assert.equal(page.sections[0].primaryCtaLabel, 'Planifica Tu Visita');
  assert.equal(page.sections[0].primaryCtaUrl, '/es/visitanos');
});

test('localized hero image alt text is preserved and trimmed', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            slides: [
              {
                fields: {
                  image: {
                    fields: {
                      file: {
                        url: '//images.ctfassets.net/hero-localized.jpg',
                      },
                    },
                  },
                  imageAltText: ' Comunidad adorando en domingo ',
                },
              },
            ],
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].slides[0].imageAltText, 'Comunidad adorando en domingo');
});

test('Spanish About Section preserves localized and trimmed content', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'aboutSection' } } },
          fields: {
            internalName: ' Sobre nosotros ',
            eyebrow: ' Nuestra comunidad ',
            headline: ' Una familia en Cristo ',
            description: ' Conectamos personas con Dios.\n',
            mainImageAltText: ' Comunidad reunida ',
            imageOverlayBadge: ' Desde 1998 ',
            imageOverlayHeadline: ' Juntos en fe ',
            cards: [
              {
                sys: { id: 'card-es', metadata: 'ignored' },
                fields: {
                  icon: ' heart ',
                  headline: ' Amor ',
                  description: ' Servimos con alegría. ',
                },
              },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections[0], {
    type: 'about',
    eyebrow: 'Nuestra comunidad',
    headline: 'Una familia en Cristo',
    description: 'Conectamos personas con Dios.',
    images: {
      main: { image: null, altText: 'Comunidad reunida' },
      secondary: { image: null, altText: null },
      tertiary: { image: null, altText: null },
    },
    imageOverlay: { badge: 'Desde 1998', headline: 'Juntos en fe' },
    cards: [
      { icon: 'heart', headline: 'Amor', description: 'Servimos con alegría.' },
    ],
  });
});

test('English About Section normalizes images, overlay, and card order', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'aboutSection' } } },
          fields: {
            eyebrow: ' About ',
            headline: ' Our church ',
            description: ' A place to belong. ',
            mainImage: {
              sys: { id: 'main-image', type: 'Asset' },
              fields: {
                title: 'Main image',
                description: ' Main description ',
                file: {
                  url: '//images.ctfassets.net/about-main.jpg',
                  contentType: 'image/jpeg',
                  details: { image: { width: 1200, height: 800 } },
                },
              },
            },
            secondaryImage: {
              fields: {
                file: { url: 'https://images.ctfassets.net/about-secondary.jpg' },
              },
            },
            imageOverlayBadge: '   ',
            imageOverlayHeadline: '\n',
            cards: [
              {
                fields: { icon: 'second', headline: ' Second ', description: ' Two ' },
              },
              {
                fields: { icon: 'first', headline: ' First ', description: ' One ' },
              },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections[0].images, {
    main: {
      image: {
        url: 'https://images.ctfassets.net/about-main.jpg',
        title: 'Main image',
        description: 'Main description',
        width: 1200,
        height: 800,
        contentType: 'image/jpeg',
      },
      altText: null,
    },
    secondary: {
      image: {
        url: 'https://images.ctfassets.net/about-secondary.jpg',
        title: '',
        description: null,
        width: null,
        height: null,
        contentType: '',
      },
      altText: null,
    },
    tertiary: { image: null, altText: null },
  });
  assert.equal(page.sections[0].imageOverlay, null);
  assert.deepEqual(page.sections[0].cards, [
    { icon: 'second', headline: 'Second', description: 'Two' },
    { icon: 'first', headline: 'First', description: 'One' },
  ]);
});

test('malformed About Card references are skipped safely', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'aboutSection' } } },
          fields: {
            cards: [
              null,
              { sys: { type: 'Link', linkType: 'Entry', id: 'unresolved-card' } },
              { fields: { icon: 'check', headline: ' Valid ', description: ' Card ' } },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections[0].cards, [
    { icon: 'check', headline: 'Valid', description: 'Card' },
  ]);
});

test('unknown page section content types are ignored safely', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'unsupportedSection' } } },
          fields: {
            headline: 'Unknown',
          },
        },
        {
          sys: { contentType: { sys: { id: 'heroSection' } } },
          fields: {
            contentMode: 'shared',
            slides: [],
          },
        },
      ],
    },
  });

  assert.equal(page.sections.length, 1);
  assert.equal(page.sections[0].type, 'hero');
});

test('Ministries Section preserves ordered lightweight summaries and safe icon fallback', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'ministriesSection' } } },
          fields: {
            eyebrow: ' Ministries ',
            headline: ' Find your place ',
            backgroundImage: createMediaAsset('//images.ctfassets.net/background.jpg'),
            ministries: [
              createMinistryEntry({
                slug: 'worship',
                icon: 'music',
                title: ' Worship ',
                shortDescription: ' Sing together ',
                detailDescription: ' Must not appear ',
                heroImage: createMediaAsset(),
                schedule: ' Must not appear ',
              }),
              createMinistryEntry({
                slug: 'kids',
                icon: 'unexpected',
                title: ' Kids ',
                shortDescription: ' Grow together ',
              }),
              { sys: { type: 'Link', linkType: 'Entry', id: 'unresolved' } },
            ],
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections, [
    {
      type: 'ministries',
      eyebrow: 'Ministries',
      headline: 'Find your place',
      backgroundImage: {
        url: 'https://images.ctfassets.net/background.jpg',
        title: 'Ministry image',
        description: 'Image description',
        width: 1200,
        height: 800,
        contentType: 'image/jpeg',
      },
      ministries: [
        {
          slug: 'worship',
          icon: 'music',
          title: 'Worship',
          shortDescription: 'Sing together',
        },
        {
          slug: 'kids',
          icon: 'users',
          title: 'Kids',
          shortDescription: 'Grow together',
        },
      ],
    },
  ]);
});

test('English Youth Section normalizes activities, images, CTA, overlay, and badge', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'youthSection' } } },
          fields: {
            eyebrow: ' Faith for the Next Generation ',
            headline: ' Youth Ministry ',
            description: ' A place to grow. ',
            activitiesHeading: ' Activities & Events ',
            activities: [
              { fields: { icon: 'music2', text: ' Youth Worship Nights ' } },
              { fields: { icon: 'unexpected', text: ' Annual Retreats ' } },
              { sys: { type: 'Link', linkType: 'Entry', id: 'unresolved-activity' } },
              { fields: { icon: 'bookOpen', text: ' Weekly Bible Study ' } },
            ],
            primaryCtaLabel: ' Follow Us ',
            primaryCtaUrl: ' https://www.instagram.com/legacyleadersofficial/ ',
            mainImage: createMediaAsset('//images.ctfassets.net/youth-main.jpg'),
            mainImageAltText: ' Youth Ministry ',
            mainImageOverlayText: ' Legacy Leaders ',
            secondaryImage: createMediaAsset('//images.ctfassets.net/youth-secondary.jpg'),
            secondaryImageAltText: ' Youth Worship ',
            tertiaryImage: createMediaAsset('//images.ctfassets.net/youth-tertiary.jpg'),
            tertiaryImageAltText: ' Youth Community ',
            floatingBadge: ' NEW ',
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections, [
    {
      type: 'youth',
      eyebrow: 'Faith for the Next Generation',
      headline: 'Youth Ministry',
      description: 'A place to grow.',
      activitiesHeading: 'Activities & Events',
      activities: [
        { icon: 'music2', text: 'Youth Worship Nights' },
        { icon: 'bookOpen', text: 'Annual Retreats' },
        { icon: 'bookOpen', text: 'Weekly Bible Study' },
      ],
      primaryCta: {
        label: 'Follow Us',
        url: 'https://www.instagram.com/legacyleadersofficial/',
      },
      images: {
        main: {
          image: {
            url: 'https://images.ctfassets.net/youth-main.jpg',
            title: 'Ministry image',
            description: 'Image description',
            width: 1200,
            height: 800,
            contentType: 'image/jpeg',
          },
          altText: 'Youth Ministry',
          overlayText: 'Legacy Leaders',
        },
        secondary: {
          image: {
            url: 'https://images.ctfassets.net/youth-secondary.jpg',
            title: 'Ministry image',
            description: 'Image description',
            width: 1200,
            height: 800,
            contentType: 'image/jpeg',
          },
          altText: 'Youth Worship',
        },
        tertiary: {
          image: {
            url: 'https://images.ctfassets.net/youth-tertiary.jpg',
            title: 'Ministry image',
            description: 'Image description',
            width: 1200,
            height: 800,
            contentType: 'image/jpeg',
          },
          altText: 'Youth Community',
        },
      },
      floatingBadge: 'NEW',
    },
  ]);
});

test('Spanish Youth Section preserves localized content and returns null for incomplete or unsafe CTAs', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'youthSection' } } },
          fields: {
            eyebrow: ' Fe para la Próxima Generación ',
            headline: ' Legacy Leaders ',
            description: ' Jóvenes fortaleciendo su fe. ',
            activitiesHeading: ' Actividades ',
            activities: [{ fields: { icon: 'mountain', text: ' Campamentos y Eventos ' } }],
            primaryCtaLabel: ' Síguenos ',
            primaryCtaUrl: ' javascript:alert(1) ',
            mainImageOverlayText: '   ',
            floatingBadge: '\n',
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].eyebrow, 'Fe para la Próxima Generación');
  assert.equal(page.sections[0].headline, 'Legacy Leaders');
  assert.equal(page.sections[0].description, 'Jóvenes fortaleciendo su fe.');
  assert.equal(page.sections[0].activitiesHeading, 'Actividades');
  assert.deepEqual(page.sections[0].activities, [
    { icon: 'mountain', text: 'Campamentos y Eventos' },
  ]);
  assert.equal(page.sections[0].primaryCta, null);
  assert.equal(page.sections[0].images.main.overlayText, null);
  assert.equal(page.sections[0].floatingBadge, null);
});

test('Youth Section CTA is null when its label or URL is missing', () => {
  const service = createContentfulService();
  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'youthSection' } } },
          fields: { primaryCtaLabel: 'Follow Us', primaryCtaUrl: '   ' },
        },
      ],
    },
  });

  assert.equal(page.sections[0].primaryCta, null);
});

test('English Contact Section normalizes contact info, ordered service times, and Google Maps embed', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'contactSection' } } },
          fields: {
            eyebrow: " We'd Love to Hear From You ",
            headline: ' Contact Us ',
            address: ' 15220 Main St, Bellevue, WA 98007 ',
            phone: ' (425) 644-6356 ',
            email: ' iglesia.hosanna@gmail.com ',
            serviceTimes: [
              { fields: { day: ' Friday ', timeDescription: ' 7:00 PM - Bible Study ' } },
              { fields: { day: ' Sunday ', timeDescription: ' 2:00 PM - Service ' } },
              { sys: { type: 'Link', linkType: 'Entry', id: 'unresolved-service-time' } },
              { fields: { day: ' Tuesday ', timeDescription: ' 7:00 PM - Prayer ' } },
            ],
            mapEmbedUrl: ' https://www.google.com/maps/embed?pb=example ',
            mapTitle: ' Hosanna Church Location ',
          },
        },
      ],
    },
  });

  assert.deepEqual(page.sections, [
    {
      type: 'contact',
      eyebrow: "We'd Love to Hear From You",
      headline: 'Contact Us',
      contactInfo: {
        address: '15220 Main St, Bellevue, WA 98007',
        phone: '(425) 644-6356',
        email: 'iglesia.hosanna@gmail.com',
      },
      serviceTimes: [
        { day: 'Friday', timeDescription: '7:00 PM - Bible Study' },
        { day: 'Sunday', timeDescription: '2:00 PM - Service' },
        { day: 'Tuesday', timeDescription: '7:00 PM - Prayer' },
      ],
      map: {
        embedUrl: 'https://www.google.com/maps/embed?pb=example',
        title: 'Hosanna Church Location',
      },
    },
  ]);
});

test('Spanish Contact Section preserves localized values and null optional phone', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'contactSection' } } },
          fields: {
            eyebrow: ' Queremos Conocerte ',
            headline: ' Contáctanos ',
            address: ' 15220 Main St, Bellevue, WA 98007 ',
            phone: '   ',
            email: ' iglesia.hosanna@gmail.com ',
            serviceTimes: [{ fields: { day: ' Viernes ', timeDescription: ' 7:00 PM - Estudio Bíblico ' } }],
            mapEmbedUrl: 'https://maps.google.com/?q=Hosanna',
            mapTitle: ' Ubicación de Iglesia Hosanna ',
          },
        },
      ],
    },
  });

  assert.equal(page.sections[0].eyebrow, 'Queremos Conocerte');
  assert.equal(page.sections[0].headline, 'Contáctanos');
  assert.equal(page.sections[0].contactInfo.phone, null);
  assert.equal(page.sections[0].contactInfo.email, 'iglesia.hosanna@gmail.com');
  assert.deepEqual(page.sections[0].serviceTimes, [
    { day: 'Viernes', timeDescription: '7:00 PM - Estudio Bíblico' },
  ]);
  assert.deepEqual(page.sections[0].map, {
    embedUrl: 'https://maps.google.com/?q=Hosanna',
    title: 'Ubicación de Iglesia Hosanna',
  });
});

test('Contact Section returns null map for missing or unsafe embed URLs', () => {
  const service = createContentfulService();

  const page = service.normalizePage({
    fields: {
      sections: [
        {
          sys: { contentType: { sys: { id: 'contactSection' } } },
          fields: { mapEmbedUrl: ' javascript:alert(1) ' },
        },
        {
          sys: { contentType: { sys: { id: 'contactSection' } } },
          fields: { mapEmbedUrl: 'https://example.com/maps/embed?pb=unsafe' },
        },
        {
          sys: { contentType: { sys: { id: 'contactSection' } } },
          fields: { mapEmbedUrl: '   ' },
        },
      ],
    },
  });

  assert.deepEqual(page.sections.map((section) => section.map), [null, null, null]);
});

test('English Ministry detail uses tenant-aware lookup and normalized detail fields', async () => {
  const calls = [];
  const service = createContentfulService({
    environment: createConfiguredContentfulEnvironment(),
    createClient: () => ({
      async getEntries(query) {
        calls.push(query);
        if (query.content_type === 'siteConfiguration') {
          return {
            items: [{ sys: { id: 'site-entry-id' }, fields: { defaultSeoMetadata: createDefaultSeoEntry() } }],
          };
        }

        return {
          items: [
            createMinistryEntry({
              seoMetadata: {
                fields: {
                  pageTitle: ' Worship SEO ',
                  description: ' Worship SEO description ',
                },
              },
            }),
          ],
        };
      },
    }),
  });

  const result = await service.getMinistry({ slug: 'worship', locale: 'en-US' });

  assert.equal(result.title, 'Worship Ministry');
  assert.equal(result.detailDescription, 'We lead worship and train musicians.');
  assert.equal(result.heroImage.url, 'https://images.ctfassets.net/ministry.jpg');
  assert.equal(result.heroImageAltText, 'Worship team');
  assert.deepEqual(result.whatWeDoItems, ['Rehearsals', 'Sunday worship', 'Instrument classes']);
  assert.deepEqual(result.leader, {
    name: 'Maria',
    image: {
      url: 'https://images.ctfassets.net/leader.jpg',
      title: 'Ministry image',
      description: 'Image description',
      width: 1200,
      height: 800,
      contentType: 'image/jpeg',
    },
    imageAltText: 'Ministry leader',
    roleLabel: 'Director',
  });
  assert.deepEqual(result.joinCta, {
    heading: 'Join us',
    description: 'Serve with us.',
    label: 'Contact us',
  });
  assert.equal(result.seoMetadata.pageTitle, 'Worship SEO');
  assert.deepEqual(calls, [
    {
      content_type: 'siteConfiguration',
      'fields.siteKey': 'hosanna',
      locale: 'en-US',
      include: 2,
      limit: 1,
    },
    {
      content_type: 'ministry',
      'fields.slug': 'worship',
      'fields.siteConfiguration.sys.id': 'site-entry-id',
      locale: 'en-US',
      include: 3,
      limit: 1,
    },
  ]);
});

test('Spanish Ministry detail uses localized fields and default SEO fallback', async () => {
  const service = createContentfulService({
    environment: createConfiguredContentfulEnvironment(),
    createClient: () => ({
      async getEntries(query) {
        if (query.content_type === 'siteConfiguration') {
          return {
            items: [{ sys: { id: 'site-entry-id' }, fields: { defaultSeoMetadata: createDefaultSeoEntry() } }],
          };
        }

        return {
          items: [
            createMinistryEntry({
              title: ' Ministerio de Alabanza ',
              shortDescription: ' Alabamos juntos ',
              detailDescription: ' Servimos a la iglesia en adoración. ',
              whatWeDoItems: [' Ensayos ', ' Servicios dominicales '],
              seoMetadata: undefined,
            }),
          ],
        };
      },
    }),
  });

  const result = await service.getMinistry({ slug: 'worship', locale: 'es' });

  assert.equal(result.title, 'Ministerio de Alabanza');
  assert.equal(result.shortDescription, 'Alabamos juntos');
  assert.equal(result.detailDescription, 'Servimos a la iglesia en adoración.');
  assert.deepEqual(result.whatWeDoItems, ['Ensayos', 'Servicios dominicales']);
  assert.equal(result.seoMetadata.pageTitle, 'Default Ministry SEO');
});

test('Ministry leader and Join CTA become null when all fields are empty', () => {
  const service = createContentfulService();
  const result = service.normalizeMinistry(
    createMinistryEntry({
      leaderName: ' ',
      leaderImage: null,
      leaderImageAltText: ' ',
      leaderRoleLabel: null,
      joinCtaHeading: ' ',
      joinCtaDescription: null,
      joinCtaLabel: ' ',
    }),
    { defaultSeoMetadata: service.normalizeSeoMetadata(null) }
  );

  assert.equal(result.leader, null);
  assert.equal(result.joinCta, null);
});

test('Ministry lookup returns null for unknown slugs and unsupported locales', async () => {
  let calls = 0;
  const service = createContentfulService({
    environment: createConfiguredContentfulEnvironment(),
    createClient: () => ({
      async getEntries() {
        calls += 1;
        return calls === 1
          ? { items: [{ sys: { id: 'site-entry-id' }, fields: {} }] }
          : { items: [] };
      },
    }),
  });

  assert.equal(await service.getMinistry({ slug: 'missing', locale: 'en-US' }), null);
  assert.equal(await service.getMinistry({ slug: 'worship', locale: 'fr' }), null);
  assert.equal(calls, 2);
});

test('CMS Ministry cache key includes site, slug, locale, and publication mode', () => {
  const service = createCmsService({
    environment: { contentful: { siteKey: 'hosanna' }, cmsCacheTtlSeconds: 300 },
    cacheService: createMockCache(),
    contentfulService: { getMinistry: async () => null },
  });

  assert.equal(
    service.buildMinistryCacheKey({ slug: 'worship', locale: 'es', preview: false }),
    'cms:ministry:hosanna:worship:es:published'
  );
});

test('Contentful failure returns source="unavailable" and page=null', async () => {
  const cmsService = createCmsService({
    contentfulService: {
      getHomePage: async () => {
        throw new Error('Contentful is down');
      },
    },
    cacheService: createMockCache(),
    environment: { cmsCacheTtlSeconds: 300 },
    logger: { error() {} },
  });

  const result = await cmsService.getHomePage({ locale: 'en-US', preview: false });

  assert.equal(result.source, 'unavailable');
  assert.equal(result.page, null);
});

test('A cached home page response avoids a second Contentful request', async () => {
  let calls = 0;
  const cmsService = createCmsService({
    contentfulService: {
      getHomePage: async () => {
        calls += 1;
        return {
          pageKey: 'home',
          title: 'Inicio',
          slug: '',
          seoMetadata: {
            pageTitle: 'Inicio',
            description: 'Pagina principal',
            socialTitle: 'Inicio',
            socialDescription: 'Pagina principal',
            socialImage: null,
            hideFromSearchEngines: false,
          },
          sections: [],
        };
      },
    },
    cacheService: createMockCache(),
    environment: { cmsCacheTtlSeconds: 300 },
    logger: { error() {} },
  });

  const first = await cmsService.getHomePage({ locale: 'en-US', preview: false });
  const second = await cmsService.getHomePage({ locale: 'en-US', preview: false });

  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test('Webhook invalidation removes CMS cache entries', () => {
  const cache = createMockCache();
  cache.set('cms:site-configuration:en-US:published', { ok: true });
  cache.set('cms:site-configuration:es:published', { ok: true });
  cache.set('events:all', { ok: true });

  const cmsService = createCmsService({
    cacheService: cache,
    contentfulService: { getHomePage: async () => null, getSiteConfiguration: async () => null },
    environment: { cmsCacheTtlSeconds: 300 },
    logger: { error() {} },
  });

  cmsService.invalidateCmsCache();

  assert.equal(cache.get('cms:site-configuration:en-US:published'), null);
  assert.equal(cache.get('cms:site-configuration:es:published'), null);
  assert.deepEqual(cache.get('events:all'), { ok: true });
});
