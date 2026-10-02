module.exports = function (migration) {
  // ------------------------------------------------------------
  // About Card
  // ------------------------------------------------------------

  const aboutCard = migration.createContentType("aboutCard", {
    name: "About Card",
    description:
      "A reusable informational card displayed in the About section.",
    displayField: "internalName",
  });

  aboutCard
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true);

  aboutCard
    .createField("icon")
    .name("Icon")
    .type("Symbol")
    .required(true)
    .validations([
      {
        in: ["target", "sparkles", "heart"],
      },
    ]);

  aboutCard
    .createField("headline")
    .name("Headline")
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

  aboutCard
    .createField("description")
    .name("Description")
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

  // ------------------------------------------------------------
  // About Section
  // ------------------------------------------------------------

  const aboutSection = migration.createContentType("aboutSection", {
    name: "About Section",
    description:
      "About Our Church section with localized copy, image collage, and informational cards.",
    displayField: "internalName",
  });

  aboutSection
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true);

  aboutSection
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

  aboutSection
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

  aboutSection
    .createField("description")
    .name("Description")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 600,
        },
      },
    ]);

  aboutSection
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

  aboutSection
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

  aboutSection
    .createField("imageOverlayBadge")
    .name("Image Overlay Badge")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 60,
        },
      },
    ]);

  aboutSection
    .createField("imageOverlayHeadline")
    .name("Image Overlay Headline")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([
      {
        size: {
          max: 120,
        },
      },
    ]);

  aboutSection
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

  aboutSection
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

  aboutSection
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

  aboutSection
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

  aboutSection
    .createField("cards")
    .name("Cards")
    .type("Array")
    .required(true)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["aboutCard"],
        },
      ],
    });

  // ------------------------------------------------------------
  // Editor appearance
  // ------------------------------------------------------------

//   migration.changeFieldControl(
//     "aboutCard",
//     "internalName",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Internal editor name. Never displayed publicly.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutCard",
//     "icon",
//     "builtin",
//     "dropdown",
//     {
//       helpText: "Icon displayed above the card content.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutCard",
//     "headline",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Localized card heading.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutCard",
//     "description",
//     "builtin",
//     "multipleLine",
//     {
//       helpText: "Localized supporting copy displayed inside the card.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "internalName",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Internal editor name. Never displayed publicly.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "eyebrow",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Small localized label displayed above the section headline.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "headline",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Main localized heading for the About section.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "description",
//     "builtin",
//     "multipleLine",
//     {
//       helpText: "Localized introductory text displayed below the headline.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "mainImage",
//     "builtin",
//     "assetLinkEditor",
//     {
//       helpText: "Large primary image displayed in the About photo collage.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "mainImageAltText",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Accessible description of the primary image.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "imageOverlayBadge",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Optional small text displayed over the primary image.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "imageOverlayHeadline",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Optional headline displayed over the primary image.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "secondaryImage",
//     "builtin",
//     "assetLinkEditor",
//     {
//       helpText: "Second image displayed in the About photo collage.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "secondaryImageAltText",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Accessible description of the second image.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "tertiaryImage",
//     "builtin",
//     "assetLinkEditor",
//     {
//       helpText: "Third image displayed in the About photo collage.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "tertiaryImageAltText",
//     "builtin",
//     "singleLine",
//     {
//       helpText: "Accessible description of the third image.",
//     }
//   );

//   migration.changeFieldControl(
//     "aboutSection",
//     "cards",
//     "builtin",
//     "entryCardsEditor",
//     {
//       helpText:
//         "Ordered informational cards displayed below the photo collage.",
//     }
//   );
};