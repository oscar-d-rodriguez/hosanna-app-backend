module.exports = function (migration) {
  const offeringPoint = migration.createContentType("offeringPoint", {
    name: "Offering Point",
    description: "A purpose for giving displayed in the Offering section.",
    displayField: "internalName",
  });

  offeringPoint
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 2, max: 100 } }]);

  offeringPoint
    .createField("icon")
    .name("Icon")
    .type("Symbol")
    .required(true)
    .validations([{ in: ["sparkles", "heartHandshake", "landmark"] }]);

  offeringPoint
    .createField("title")
    .name("Title")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([{ size: { min: 1, max: 100 } }]);

  offeringPoint
    .createField("description")
    .name("Description")
    .type("Text")
    .localized(true)
    .required(true)
    .validations([{ size: { min: 1, max: 500 } }]);

  const offeringSection = migration.createContentType("offeringSection", {
    name: "Offering Section",
    description: "Homepage giving section with donation information and giving purposes.",
    displayField: "internalName",
  });

  offeringSection
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 2, max: 100 } }]);

  [
    ["eyebrow", "Eyebrow", 60],
    ["headline", "Headline", 100],
    ["cardEyebrow", "Card Eyebrow", 80],
    ["cardHeadline", "Card Headline", 120],
    ["donateCtaLabel", "Donate CTA Label", 60],
    ["accountLabel", "Account Label", 80],
    ["accountValue", "Account Value", 160],
    ["thankYouHeading", "Thank You Heading", 100],
  ].forEach(([id, name, max]) => {
    offeringSection
      .createField(id)
      .name(name)
      .type("Symbol")
      .localized(true)
      .required(id !== "donateCtaLabel")
      .validations([{ size: { min: 1, max } }]);
  });

  [
    ["description", "Description", 1000],
    ["cardDescription", "Card Description", 1000],
    ["accountDescription", "Account Description", 500],
    ["thankYouDescription", "Thank You Description", 500],
  ].forEach(([id, name, max]) => {
    offeringSection
      .createField(id)
      .name(name)
      .type("Text")
      .localized(true)
      .required(true)
      .validations([{ size: { min: 1, max } }]);
  });

  offeringSection
    .createField("donateCtaUrl")
    .name("Donate CTA URL")
    .type("Symbol")
    .required(false)
    .validations([{ size: { max: 500 } }]);

  offeringSection
    .createField("givingPoints")
    .name("Giving Points")
    .type("Array")
    .required(true)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["offeringPoint"] }],
    });

  const serviceScheduleItem = migration.createContentType("serviceScheduleItem", {
    name: "Service Schedule Item",
    description: "A scheduled church gathering displayed in the Service Times section.",
    displayField: "internalName",
  });

  serviceScheduleItem
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 2, max: 100 } }]);

  [
    ["day", "Day", 40],
    ["time", "Time", 40],
    ["description", "Description", 120],
  ].forEach(([id, name, max]) => {
    serviceScheduleItem
      .createField(id)
      .name(name)
      .type("Symbol")
      .localized(true)
      .required(true)
      .validations([{ size: { min: 1, max } }]);
  });

  const serviceTimesSection = migration.createContentType("serviceTimesSection", {
    name: "Service Times Section",
    description: "Homepage service schedule, address, and optional background image.",
    displayField: "internalName",
  });

  serviceTimesSection
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 2, max: 100 } }]);

  [
    ["eyebrow", "Eyebrow", 60],
    ["headline", "Headline", 100],
    ["address", "Address", 200],
  ].forEach(([id, name, max]) => {
    serviceTimesSection
      .createField(id)
      .name(name)
      .type("Symbol")
      .localized(true)
      .required(true)
      .validations([{ size: { min: 1, max } }]);
  });

  serviceTimesSection
    .createField("services")
    .name("Service Schedule")
    .type("Array")
    .required(true)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["serviceScheduleItem"] }],
    });

  serviceTimesSection
    .createField("backgroundImage")
    .name("Background Image")
    .type("Link")
    .linkType("Asset")
    .required(false)
    .validations([{ linkMimetypeGroup: ["image"] }]);

  serviceTimesSection
    .createField("backgroundImageAltText")
    .name("Background Image Alt Text")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([{ size: { max: 150 } }]);
};
