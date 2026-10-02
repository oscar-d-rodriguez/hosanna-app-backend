module.exports = function (migration) {
  // ============================================================
  // Youth Activity
  // ============================================================

  const youthActivity = migration.createContentType("youthActivity", {
    name: "Youth Activity",
    description:
      "An activity displayed in a Youth Section. The activity contains display text and a controlled icon.",
    displayField: "internalName",
  });

  youthActivity
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

  youthActivity
    .createField("icon")
    .name("Icon")
    .type("Symbol")
    .required(true)
    .validations([
      {
        in: ["bookOpen", "music2", "mountain"],
      },
    ]);

  youthActivity
    .createField("text")
    .name("Text")
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

  // ============================================================
  // Youth Section
  // ============================================================

  const youthSection = migration.createContentType("youthSection", {
    name: "Youth Section",
    description:
      "Youth ministry homepage section with localized content, activities, CTA, and image collage.",
    displayField: "internalName",
  });

  youthSection
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

  youthSection
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

  youthSection
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

  youthSection
    .createField("description")
    .name("Description")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 1000,
        },
      },
    ]);

  youthSection
    .createField("activitiesHeading")
    .name("Activities Heading")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 80,
        },
      },
    ]);

  youthSection
    .createField("activities")
    .name("Activities")
    .type("Array")
    .required(true)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["youthActivity"],
        },
      ],
    });

  youthSection
    .createField("primaryCtaLabel")
    .name("Primary CTA Label")
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

  youthSection
    .createField("primaryCtaUrl")
    .name("Primary CTA URL")
    .type("Symbol")
    .required(false);

  youthSection
    .createField("mainImage")
    .name("Main Image")
    .type("Link")
    .linkType("Asset")
    .required(true)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  youthSection
    .createField("mainImageAltText")
    .name("Main Image Alt Text")
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

  youthSection
    .createField("mainImageOverlayText")
    .name("Main Image Overlay Text")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 80,
        },
      },
    ]);

  youthSection
    .createField("secondaryImage")
    .name("Secondary Image")
    .type("Link")
    .linkType("Asset")
    .required(true)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  youthSection
    .createField("secondaryImageAltText")
    .name("Secondary Image Alt Text")
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

  youthSection
    .createField("tertiaryImage")
    .name("Tertiary Image")
    .type("Link")
    .linkType("Asset")
    .required(true)
    .validations([
      {
        linkMimetypeGroup: ["image"],
      },
    ]);

  youthSection
    .createField("tertiaryImageAltText")
    .name("Tertiary Image Alt Text")
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

  youthSection
    .createField("floatingBadge")
    .name("Floating Badge")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 30,
        },
      },
    ]);
};