import { readFileSync, writeFileSync } from "fs";
import { Mintdoc } from "../dist/index.mjs";

// 1. Read the template
const template = readFileSync("examples/template.docx");

// 2. Render with data
const doc = new Mintdoc();
const output = doc.render(template, {
  name: "Alice",
  company: "Acme Corp",
  premium: true,
  items: [
    { name: "Widget", price: 29, category: "Électronique" },
    { name: "Gadget", price: 49 },
    { name: "Gizmo", price: 99, category: "Accessoire" },
  ],
});

// 3. Save the result
writeFileSync("examples/output.docx", output);
console.log("Done! Open examples/output.docx in Word.");
