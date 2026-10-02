module.exports = function (migration) {
  // ============================================================
  // Contact Service Time
  // ============================================================

  const serviceTime = migration.createContentType("contactServiceTime", {
    name: "Contact Service Time",
    description:
      "A service or recurring church meeting displayed in the Contact section.",
    displayField: "internalName",
  });

  serviceTime
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

  serviceTime
    .createField("day")
    .name("Day")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 40,
        },
      },
    ]);

  serviceTime
    .createField("timeDescription")
    .name("Time / Description")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 120,
        },
      },
    ]);

  // ============================================================
  // Contact Section
  // ============================================================

  const contactSection = migration.createContentType("contactSection", {
    name: "Contact Section",
    description:
      "Homepage contact section containing church contact information, service times, and map configuration.",
    displayField: "internalName",
  });

  contactSection
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

  contactSection
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

  contactSection
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

  contactSection
    .createField("address")
    .name("Address")
    .type("Symbol")
    .required(true)
    .validations([
      {
        size: {
          min: 1,
          max: 200,
        },
      },
    ]);

  contactSection
    .createField("phone")
    .name("Phone")
    .type("Symbol")
    .required(false)
    .validations([
      {
        size: {
          max: 50,
        },
      },
    ]);

  contactSection
    .createField("email")
    .name("Email")
    .type("Symbol")
    .required(true)
    .validations([
      {
        regexp: {
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        },
      },
    ]);

  contactSection
    .createField("serviceTimes")
    .name("Service Times")
    .type("Array")
    .required(true)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [
        {
          linkContentType: ["contactServiceTime"],
        },
      ],
    });

  // Use Text instead of Symbol because Google Maps embed URLs can be long.
  contactSection
    .createField("mapEmbedUrl")
    .name("Map Embed URL")
    .type("Text")
    .required(false);

  contactSection
    .createField("mapTitle")
    .name("Map Title")
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
};