// Provides the build instructions for the custom Service Worker generation.

// Unifnished
// https://karannagupta.com/using-custom-workbox-service-workers-with-create-react-app/

//  Is the template for Workbox Service Worker. Custom caching rules go here.
const workboxBuild = require("workbox-build");
// NOTE: This should be run *AFTER* all your assets are built

interface WorkBuildResult {
  count: number;
  size: number;
  warnings: string[];
}

export const buildSW = () => {
  // This will return a Promise
  return workboxBuild
    .injectManifest({
      swSrc: "src/sw-template.js", // this is your sw template file
      swDest: "build/sw.js", // this will be created in the build step
      globDirectory: "build",
      globPatterns: ["**/*.{js,css,html,png}"]
    })
    .then(({ count, size, warnings }: WorkBuildResult) => {
      // Optionally, log any warnings and details.
      warnings.forEach(console.warn);
      console.log(`${count} files will be precached, totaling ${size} bytes.`);
    });
};
buildSW();
