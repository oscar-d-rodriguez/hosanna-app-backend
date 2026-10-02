module.exports = function (migration) {
  const siteLink = migration.createContentType("siteLink", {
    name: "Site Link",
    description: "An ordered navigation or footer link for the website.",
    displayField: "internalName",
  });

  siteLink
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 2, max: 100 } }]);

  siteLink
    .createField("label")
    .name("Label")
    .type("Symbol")
    .localized(true)
    .required(true)
    .validations([{ size: { min: 1, max: 80 } }]);

  siteLink
    .createField("href")
    .name("Destination URL")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 1, max: 500 } }]);

  siteLink
    .createField("isOffering")
    .name("Is Offering Button")
    .type("Boolean")
    .required(false);

  const siteSocialLink = migration.createContentType("siteSocialLink", {
    name: "Site Social Link",
    description: "A supported social account displayed in the website footer.",
    displayField: "internalName",
  });

  siteSocialLink
    .createField("internalName")
    .name("Internal Name")
    .type("Symbol")
    .required(true)
    .validations([{ size: { min: 2, max: 100 } }]);

  siteSocialLink
    .createField("platform")
    .name("Platform")
    .type("Symbol")
    .required(true)
    .validations([{ in: ["facebook", "instagram", "youtube"] }]);

  siteSocialLink
    .createField("href")
    .name("Profile URL")
    .type("Symbol")
    .required(true)
    .validations([
      { regexp: { pattern: "^https://" } },
      { size: { min: 1, max: 500 } },
    ]);

  const siteConfiguration = migration.editContentType("siteConfiguration");

  siteConfiguration
    .createField("navigationItems")
    .name("Navigation Items")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["siteLink"] }],
    });

  siteConfiguration
    .createField("offeringUrl")
    .name("Offering Destination URL")
    .type("Symbol")
    .required(false)
    .validations([{ size: { max: 500 } }]);

  siteConfiguration
    .createField("footerTagline")
    .name("Footer Tagline")
    .type("Text")
    .localized(true)
    .required(false);

  siteConfiguration
    .createField("footerQuickLinksHeading")
    .name("Footer Quick Links Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([{ size: { max: 80 } }]);

  siteConfiguration
    .createField("footerConnectHeading")
    .name("Footer Connect Heading")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([{ size: { max: 80 } }]);

  siteConfiguration
    .createField("footerCopyright")
    .name("Footer Copyright Text")
    .type("Symbol")
    .localized(true)
    .required(false)
    .validations([{ size: { max: 120 } }]);

  siteConfiguration
    .createField("footerLinks")
    .name("Footer Quick Links")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["siteLink"] }],
    });

  siteConfiguration
    .createField("footerSocialLinks")
    .name("Footer Social Links")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["siteSocialLink"] }],
    });

  siteConfiguration
    .createField("footerAddress")
    .name("Footer Address")
    .type("Symbol")
    .required(false)
    .validations([{ size: { max: 200 } }]);

  siteConfiguration
    .createField("footerPhone")
    .name("Footer Phone")
    .type("Symbol")
    .required(false)
    .validations([{ size: { max: 50 } }]);

  siteConfiguration
    .createField("footerEmail")
    .name("Footer Email")
    .type("Symbol")
    .required(false)
    .validations([
      { regexp: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" } },
      { size: { max: 254 } },
    ]);
};
