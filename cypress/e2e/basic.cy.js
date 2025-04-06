/// <reference types="cypress" />
import { CHAPTERS } from "../../lib/config";

describe("Website navigation and content tests", () => {
  it("root page (/) shows intro.mdx content with correct layout", () => {
    open("/");
    cy.contains("h1", "Placeholder title");
    // Check menu exists and has correct items
    cy.get("nav").should("exist");
    cy.get("nav").contains("Test").should("not.exist");

    // Test menu navigation - verify at least Test page is accessible
    cy.visit("/test");
    cy.contains("h1", "Feature Demo and Test Page").should("exist");
  });
});
