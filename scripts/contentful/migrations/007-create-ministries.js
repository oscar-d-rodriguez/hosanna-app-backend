module.exports = function (migration) {
  // ============================================================
  // Ministry
  // ============================================================

  const ministry = migration.createContentType("ministry", {
    name: "Ministry",
    description:
      "A church ministry used by the homepage Ministries section and its ministry detail page.",
    displayField: "internalName",
  });

  ministry
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: {
          min: 2,
          max: 100,
        },
      },
    ]);

  // Required for future multi-church / white-label support.
  ministry
    .createField("siteConfiguration")
    .name("Site Configuration")
    .type("Link")
    .linkType("Entry")
    .required(true)
    .validations([
      {
        linkContentType: ["siteConfiguration"],
      },
    ]);

  // Stable route identifier. Not localized.
  ministry
    .createField("slug")
    .name("Slug")
    .type("Symbol")
    .required(true)
    .validations([
      {
        regexp: {
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        },
      },
      {
        size: {
          min: 2,
          max: 80,
        },
      },
    ]);

  ministry
    .createField("icon")
    .name("Icon")
    .type("Symbol")
    .required(true)
    .validations([
      {
        in: [
          "music",
          "baby",
          "users",
          "userCircle",
          "globe",
          "handHeart",
        ],
      },
    ]);

  ministry
    .createField("title")
    .name("Title")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 100,
        },
      },
    ]);

  // Homepage Ministries card copy.
  ministry
    .createField("shortDescription")
    .name("Short Description")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 500,
        },
      },
    ]);

  // Longer copy for /ministries/[slug].
  ministry
    .createField("detailDescription")
    .name("Detail Description")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 2000,
        },
      },
    ]);

  ministry
    .createField("heroImage")
    .name("Hero Image")
    .type("Link")
    .linkType("Asset")
    .required(true)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  ministry
    .createField("heroImageAltText")
    .name("Hero Image Alt Text")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 150,
        },
      },
    ]);

  ministry
    .createField("leaderName")
    .name("Leader Name")
    .type("Symbol")
    .required(false)
    .validations([
      {
        size: {
          min: 1,
          max: 100,
        },
      },
    ]);

  ministry
    .createField("leaderImage")
    .name("Leader Image")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  ministry
    .createField("leaderImageAltText")
    .name("Leader Image Alt Text")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          min: 1,
          max: 150,
        },
      },
    ]);

  ministry
    .createField("leaderRoleLabel")
    .name("Leader Role Label")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          min: 1,
          max: 60,
        },
      },
    ]);

  // "What We Do" content.
  // These are plain text items, NOT links or referenced entries.
  ministry
    .createField("whatWeDoItems")
    .name("What We Do Items")
    .type("Array")
    .localized(true)
    .required(true)
    .items({
      type: "Symbol",
      validations: [
        {
          size: {
            min: 1,
            max: 300,
          },
        },
      ],
    });

  ministry
    .createField("schedule")
    .name("Schedule")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 500,
        },
      },
    ]);

  ministry
    .createField("contactEmail")
    .name("Contact Email")
    .type("Symbol")
    .required(false)
    .validations([
      {
        regexp: {
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        },
      },
    ]);

  ministry
    .createField("joinCtaHeading")
    .name("Join CTA Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 100,
        },
      },
    ]);

  ministry
    .createField("joinCtaDescription")
    .name("Join CTA Description")
    .type("Text")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 500,
        },
      },
    ]);

  ministry
    .createField("joinCtaLabel")
    .name("Join CTA Label")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 50,
        },
      },
    ]);

  ministry
    .createField("seoMetadata")
    .name("SEO Metadata")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([
      {
        linkContentType: ["seoMetadata"],
      },
    ]);

  // ============================================================
  // Ministries Section
  // ============================================================

  const ministriesSection = migration.createContentType(
    "ministriesSection",
    {
      name: "Ministries Section",
      description:
        "Homepage section displaying an ordered collection of ministries.",
      displayField: "internalName",
    }
  );

  ministriesSection
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: {
          min: 2,
          max: 100,
        },
      },
    ]);

  ministriesSection
    .createField("eyebrow")
    .name("Eyebrow")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 60,
        },
      },
    ]);

  ministriesSection
    .createField("headline")
    .name("Headline")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 100,
        },
      },
    ]);

  ministriesSection
    .createField("backgroundImage")
    .name("Background Image")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  ministriesSection
    .createField("ministries")
    .name("Ministries")
    .type("Array")
    .required(true)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["ministry"],
        },
      ],
    });
};